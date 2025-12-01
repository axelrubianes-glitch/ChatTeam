// src/lib/ensureUserDoc.ts
import type { User } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.config";

/**
 * Garantiza que exista users/{uid} en Firestore con mínimo email.
 * No borra campos existentes (merge: true).
 */
export async function ensureUserDoc(user: User) {
  if (!user?.uid) return;

  const ref = doc(db, "users", user.uid);

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? "",
      providers: (user.providerData || []).map((p) => p.providerId),
      updatedAt: serverTimestamp(),
      // solo se setea la 1ra vez si el doc no existía; con merge true no molesta
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}
