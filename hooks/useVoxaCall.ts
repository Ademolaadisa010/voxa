/**
 * hooks/useVoxaCall.ts
 * WebRTC hook fully wired to Firebase signalling via lib/rooms.ts
 *
 * Usage inside /call/[roomId]/page.tsx:
 *
 *   const call = useVoxaCall({ roomId, role: "caller" })
 *   useEffect(() => { call.start() }, [])
 *
 *   const call = useVoxaCall({ roomId, role: "callee" })
 *   useEffect(() => { call.join() }, [])
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  writeOffer,
  writeAnswer,
  pushCallerCandidate,
  pushCalleeCandidate,
  listenForOffer,
  listenForAnswer,
  listenForCallerCandidates,
  listenForCalleeCandidates,
  listenForHangup,
  writeHangup,
  deleteRoom,
} from "@/lib/rooms";

/* ─── types ─── */
export type CallStatus =
  | "idle"
  | "requesting-mic"
  | "waiting"
  | "connecting"
  | "connected"
  | "ended"
  | "error";

export interface UseVoxaCallOptions {
  roomId: string;
  role: "caller" | "callee";
  onRemoteStream?: (stream: MediaStream) => void;
  onStatusChange?: (s: CallStatus) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Add TURN for production (needed behind strict NAT):
  // { urls: "turn:YOUR_TURN:3478", username: "x", credential: "x" }
];

/* ════════════════════════════════════ */
export function useVoxaCall({
  roomId,
  role,
  onRemoteStream,
  onStatusChange,
}: UseVoxaCallOptions) {
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localRef       = useRef<MediaStream | null>(null);
  const unsubsRef      = useRef<Array<() => void>>([]);

  const [status,        setStatus]       = useState<CallStatus>("idle");
  const [localStream,   setLocalStream]  = useState<MediaStream | null>(null);
  const [remoteStream,  setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted,       setIsMuted]      = useState(false);
  const [error,         setError]        = useState<string | null>(null);

  useEffect(() => { onStatusChange?.(status); }, [status, onStatusChange]);

  /* ── mic ── */
  async function getMic() {
    setStatus("requesting-mic");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
        video: false,
      });
      localRef.current = s;
      setLocalStream(s);
      return s;
    } catch (err) {
      const msg = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Microphone permission denied. Please allow mic access and try again."
        : "Could not access microphone.";
      setError(msg);
      setStatus("error");
      throw new Error(msg);
    }
  }

  /* ── build PC ── */
  function buildPC(stream: MediaStream) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const remote = new MediaStream();
    pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      setRemoteStream(remote);
      onRemoteStream?.(remote);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connecting")   setStatus("connecting");
      if (pc.connectionState === "connected")    setStatus("connected");
      if (["disconnected","failed","closed"].includes(pc.connectionState)) cleanup();
    };

    pcRef.current = pc;
    return pc;
  }

  /* ── CALLER: create offer ── */
  const start = useCallback(async () => {
    try {
      const stream = await getMic();
      const pc     = buildPC(stream);

      pc.onicecandidate = (e) => {
        if (e.candidate) pushCallerCandidate(roomId, e.candidate.toJSON());
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await writeOffer(roomId, offer);
      setStatus("waiting");

      // listen for answer from callee
      const u1 = listenForAnswer(roomId, async (answer) => {
        if (!pc.remoteDescription)
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      // listen for callee ICE candidates
      const u2 = listenForCalleeCandidates(roomId, async (c) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      });

      // listen for hangup
      const u3 = listenForHangup(roomId, () => cleanup());

      unsubsRef.current.push(u1, u2, u3);
    } catch { /* error already set */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /* ── CALLEE: wait for offer, send answer ── */
  const join = useCallback(async () => {
    try {
      const stream = await getMic();
      const pc     = buildPC(stream);
      setStatus("waiting");

      pc.onicecandidate = (e) => {
        if (e.candidate) pushCalleeCandidate(roomId, e.candidate.toJSON());
      };

      // listen for caller's offer
      const u1 = listenForOffer(roomId, async (offer) => {
        if (pc.remoteDescription) return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await writeAnswer(roomId, answer);
      });

      // listen for caller ICE candidates
      const u2 = listenForCallerCandidates(roomId, async (c) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      });

      // listen for hangup
      const u3 = listenForHangup(roomId, () => cleanup());

      unsubsRef.current.push(u1, u2, u3);
    } catch { /* error already set */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  /* ── hangup ── */
  const hangup = useCallback(async () => {
    await writeHangup(roomId);
    cleanup();
    await deleteRoom(roomId);
  }, [roomId]);

  /* ── mute ── */
  const toggleMute = useCallback(() => {
    localRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((m) => !m);
  }, []);

  /* ── cleanup ── */
  function cleanup() {
    unsubsRef.current.forEach((fn) => fn());
    unsubsRef.current = [];
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setStatus("ended");
  }

  useEffect(() => () => {
    unsubsRef.current.forEach((fn) => fn());
    pcRef.current?.close();
    localRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  return { status, localStream, remoteStream, isMuted, error, start, join, hangup, toggleMute };
}