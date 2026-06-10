/**
 * lib/rooms.ts
 * Firebase Realtime DB helpers for Voxa call rooms.
 *
 * Room structure:
 *   rooms/{roomId}/
 *     createdAt     — number
 *     offer         — { type, sdp }
 *     answer        — { type, sdp }
 *     callerCandidates/{id} — RTCIceCandidateInit
 *     calleeCandidates/{id} — RTCIceCandidateInit
 *     hangup        — boolean
 */

import {
  ref,
  set,
  push,
  get,
  onValue,
  onChildAdded,
  remove,
  serverTimestamp,
  off,
} from "firebase/database";
import { db } from "./firebase";

/* ─── path helpers ─── */
const r = {
  room:    (id: string) => ref(db, `rooms/${id}`),
  offer:   (id: string) => ref(db, `rooms/${id}/offer`),
  answer:  (id: string) => ref(db, `rooms/${id}/answer`),
  callerC: (id: string) => ref(db, `rooms/${id}/callerCandidates`),
  calleeC: (id: string) => ref(db, `rooms/${id}/calleeCandidates`),
  hangup:  (id: string) => ref(db, `rooms/${id}/hangup`),
};

/* ─── Generate a unique room ID and write a placeholder ─── */
export async function createRoom(): Promise<string> {
  const roomId = Math.random().toString(36).slice(2, 9);
  await set(r.room(roomId), { createdAt: serverTimestamp() });
  return roomId;
}

/* ─── Check a room exists (for joiners) ─── */
export async function roomExists(roomId: string): Promise<boolean> {
  const snap = await get(r.room(roomId));
  return snap.exists();
}

/* ─── Offer ─── */
export async function writeOffer(roomId: string, offer: RTCSessionDescriptionInit) {
  await set(r.offer(roomId), { type: offer.type, sdp: offer.sdp });
}

export function listenForOffer(
  roomId: string,
  cb: (offer: RTCSessionDescriptionInit) => void
) {
  const node = r.offer(roomId);
  const handler = onValue(node, (snap) => {
    const v = snap.val();
    if (v?.type && v?.sdp) cb(v);
  });
  return () => off(node, "value", handler);
}

/* ─── Answer ─── */
export async function writeAnswer(roomId: string, answer: RTCSessionDescriptionInit) {
  await set(r.answer(roomId), { type: answer.type, sdp: answer.sdp });
}

export function listenForAnswer(
  roomId: string,
  cb: (answer: RTCSessionDescriptionInit) => void
) {
  const node = r.answer(roomId);
  const handler = onValue(node, (snap) => {
    const v = snap.val();
    if (v?.type && v?.sdp) cb(v);
  });
  return () => off(node, "value", handler);
}

/* ─── ICE candidates ─── */
export async function pushCallerCandidate(roomId: string, c: RTCIceCandidateInit) {
  await push(r.callerC(roomId), c);
}

export async function pushCalleeCandidate(roomId: string, c: RTCIceCandidateInit) {
  await push(r.calleeC(roomId), c);
}

export function listenForCallerCandidates(
  roomId: string,
  cb: (c: RTCIceCandidateInit) => void
) {
  const node = r.callerC(roomId);
  const handler = onChildAdded(node, (snap) => { if (snap.val()) cb(snap.val()); });
  return () => off(node, "child_added", handler);
}

export function listenForCalleeCandidates(
  roomId: string,
  cb: (c: RTCIceCandidateInit) => void
) {
  const node = r.calleeC(roomId);
  const handler = onChildAdded(node, (snap) => { if (snap.val()) cb(snap.val()); });
  return () => off(node, "child_added", handler);
}

/* ─── Hangup ─── */
export async function writeHangup(roomId: string) {
  await set(r.hangup(roomId), true);
}

export function listenForHangup(roomId: string, cb: () => void) {
  const node = r.hangup(roomId);
  const handler = onValue(node, (snap) => { if (snap.val() === true) cb(); });
  return () => off(node, "value", handler);
}

/* ─── Cleanup (call after both sides disconnect) ─── */
export async function deleteRoom(roomId: string) {
  await remove(r.room(roomId));
}