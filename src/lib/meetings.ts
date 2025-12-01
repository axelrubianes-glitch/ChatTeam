import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase.config";

export type Meeting = {
  hostUid: string;
  hostName: string;
  active: boolean;
  participantsCount: number;
  createdAt?: any;
  endedAt?: any;
  lastActiveAt?: any;
};

export type Participant = { uid: string; name: string };

export async function createMeetingDoc(roomId: string, host: Participant) {
  const ref = doc(db, "meetings", roomId);
  await setDoc(
    ref,
    {
      hostUid: host.uid,
      hostName: host.name,
      active: true,
      participantsCount: 0,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      endedAt: null,
    } satisfies Meeting,
    { merge: false }
  );
}

export async function getMeeting(roomId: string) {
  const ref = doc(db, "meetings", roomId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Meeting) };
}

export async function joinMeetingFirestore(roomId: string, me: Participant) {
  const meetingRef = doc(db, "meetings", roomId);
  const partRef = doc(db, "meetings", roomId, "participants", me.uid);

  await runTransaction(db, async (tx) => {
    const mSnap = await tx.get(meetingRef);
    if (!mSnap.exists()) throw new Error("ROOM_NOT_FOUND");

    const data = mSnap.data() as Meeting;
    if (data.active === false) throw new Error("ROOM_ENDED");

    const pSnap = await tx.get(partRef);

    // si ya estaba, NO incrementes
    if (!pSnap.exists()) {
      const current = Number(data.participantsCount || 0);
      tx.update(meetingRef, {
        participantsCount: current + 1,
        lastActiveAt: serverTimestamp(),
      });
    } else {
      tx.update(meetingRef, { lastActiveAt: serverTimestamp() });
    }

    tx.set(partRef, { uid: me.uid, name: me.name, joinedAt: serverTimestamp() }, { merge: true });
  });
}

export async function leaveMeetingFirestore(roomId: string, me: Participant) {
  const meetingRef = doc(db, "meetings", roomId);
  const partRef = doc(db, "meetings", roomId, "participants", me.uid);

  await runTransaction(db, async (tx) => {
    const mSnap = await tx.get(meetingRef);
    if (!mSnap.exists()) return;

    const data = mSnap.data() as Meeting;

    const pSnap = await tx.get(partRef);
    if (!pSnap.exists()) return; // si no estaba, no restes

    tx.delete(partRef);

    const current = Number(data.participantsCount || 0);
    const next = Math.max(0, current - 1);

    const patch: any = {
      participantsCount: next,
      lastActiveAt: serverTimestamp(),
    };

    // ✅ Finaliza SOLO cuando queda 0
    if (next === 0) {
      patch.active = false;
      patch.endedAt = serverTimestamp();
    }

    tx.update(meetingRef, patch);
  });
}

export function listenParticipants(roomId: string, cb: (p: Participant[]) => void): Unsubscribe {
  return onSnapshot(collection(db, "meetings", roomId, "participants"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Participant));
  });
}
