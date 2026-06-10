/**
 * lib/signalling.ts
 * Firebase Realtime Database signalling for Voxa WebRTC calls.
 *
 * DB structure per room:
 *
 * rooms/
 *   {roomId}/
 *     offer        — RTCSessionDescriptionInit (set by caller)
 *     answer       — RTCSessionDescriptionInit (set by callee)
 *     callerCandidates/  — ICE candidates from caller
 *       {pushId}: RTCIceCandidateInit
 *     calleeCandidates/  — ICE candidates from callee
 *       {pushId}: RTCIceCandidateInit
 *     hangup       — boolean (set by either side to end call)
 *     createdAt    — number (Unix ms, for cleanup)
 */

import {
  ref,
  set,
  push,
  onValue,
  onChildAdded,
  remove,
  serverTimestamp,
  off,
  type DatabaseReference,
  type Unsubscribe,
} from "firebase/database";
import { db } from "./firebase";

/* ─── Room reference helpers ─── */
const roomRef   = (id: string) => ref(db, `rooms/${id}`);
const offerRef  = (id: string) => ref(db, `rooms/${id}/offer`);
const answerRef = (id: string) => ref(db, `rooms/${id}/answer`);
const callerCandidatesRef = (id: string) => ref(db, `rooms/${id}/callerCandidates`);
const calleeCandidatesRef = (id: string) => ref(db, `rooms/${id}/calleeCandidates`);
const hangupRef = (id: string) => ref(db, `rooms/${id}/hangup`);

/* ════════════════════════════════════════
   CALLER SIDE
════════════════════════════════════════ */

/** Write the WebRTC offer to Firebase */
export async function sendOffer(
  roomId: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  await set(roomRef(roomId), {
    offer: { type: offer.type, sdp: offer.sdp },
    createdAt: serverTimestamp(),
  });
}

/** Listen for the callee's answer */
export function onAnswer(
  roomId: string,
  callback: (answer: RTCSessionDescriptionInit) => void
): Unsubscribe {
  const r = answerRef(roomId);
  const handler = onValue(r, (snap) => {
    const data = snap.val();
    if (data?.type && data?.sdp) callback(data as RTCSessionDescriptionInit);
  });
  return () => off(r, "value", handler);
}

/** Push a caller ICE candidate */
export async function sendCallerCandidate(
  roomId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await push(callerCandidatesRef(roomId), candidate);
}

/** Listen for callee ICE candidates (caller subscribes) */
export function onCalleeCandidates(
  roomId: string,
  callback: (candidate: RTCIceCandidateInit) => void
): Unsubscribe {
  const r = calleeCandidatesRef(roomId);
  const handler = onChildAdded(r, (snap) => {
    const data = snap.val();
    if (data) callback(data as RTCIceCandidateInit);
  });
  return () => off(r, "child_added", handler);
}

/* ════════════════════════════════════════
   CALLEE SIDE
════════════════════════════════════════ */

/** Listen for the caller's offer */
export function onOffer(
  roomId: string,
  callback: (offer: RTCSessionDescriptionInit) => void
): Unsubscribe {
  const r = offerRef(roomId);
  const handler = onValue(r, (snap) => {
    const data = snap.val();
    if (data?.type && data?.sdp) callback(data as RTCSessionDescriptionInit);
  });
  return () => off(r, "value", handler);
}

/** Write the WebRTC answer to Firebase */
export async function sendAnswer(
  roomId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await set(answerRef(roomId), { type: answer.type, sdp: answer.sdp });
}

/** Push a callee ICE candidate */
export async function sendCalleeCandidate(
  roomId: string,
  candidate: RTCIceCandidateInit
): Promise<void> {
  await push(calleeCandidatesRef(roomId), candidate);
}

/** Listen for caller ICE candidates (callee subscribes) */
export function onCallerCandidates(
  roomId: string,
  callback: (candidate: RTCIceCandidateInit) => void
): Unsubscribe {
  const r = callerCandidatesRef(roomId);
  const handler = onChildAdded(r, (snap) => {
    const data = snap.val();
    if (data) callback(data as RTCIceCandidateInit);
  });
  return () => off(r, "child_added", handler);
}

/* ════════════════════════════════════════
   SHARED
════════════════════════════════════════ */

/** Either side calls this to end the call */
export async function sendHangup(roomId: string): Promise<void> {
  await set(hangupRef(roomId), true);
}

/** Listen for a hangup signal from the other side */
export function onHangup(
  roomId: string,
  callback: () => void
): Unsubscribe {
  const r = hangupRef(roomId);
  const handler = onValue(r, (snap) => {
    if (snap.val() === true) callback();
  });
  return () => off(r, "value", handler);
}

/** Clean up the entire room from Firebase (call after both disconnect) */
export async function deleteRoom(roomId: string): Promise<void> {
  await remove(roomRef(roomId));
}

/** Generate a short unique room ID */
export function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 9);
}