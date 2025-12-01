/**
 * @file useAuthStore.ts
 * @description Zustand global store to manage user authentication state with Firebase.
 */

import { create } from "zustand";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  linkWithPopup,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "../lib/firebase.config";

interface AuthState {
  user: User | null;
  loading: boolean;

  // Logins normales (DEVUELVEN el UserCredential)
  loginWithGoogle: () => Promise<UserCredential>;
  loginWithFacebook: () => Promise<UserCredential>;

  // Métodos avanzados: vincular proveedores a la cuenta actual
  linkGoogle: () => Promise<void>;
  linkFacebook: () => Promise<void>;

  logout: () => Promise<void>;
  initAuthObserver: () => () => void; // cleanup
}

// Crea/actualiza el doc del usuario en Firestore (sin dañar campos existentes)
async function upsertUserDoc(user: User) {
  try {
    const ref = doc(db, "users", user.uid);

    // OJO: en algunos casos Facebook puede no devolver email si no está permitido en permisos
    const email = user.email ?? user.providerData?.[0]?.email ?? null;

    await setDoc(
      ref,
      {
        uid: user.uid,
        email,
        displayName: user.displayName ?? null,
        photoURL: user.photoURL ?? null,
        providers: (user.providerData || []).map((p) => p.providerId),
        updatedAt: serverTimestamp(),
        // solo se setea si NO existía (pero con merge true no rompe si ya está)
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error("[FIRESTORE] No se pudo crear/actualizar users/{uid}:", e);
  }
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  /** Detecta automáticamente si hay un usuario autenticado */
  initAuthObserver: () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      set({ user: currentUser, loading: false });

      // Si ya había sesión, asegura que exista el doc en Firestore
      if (currentUser) upsertUserDoc(currentUser);
    });

    return unsubscribe;
  },

  /** Login con Google */
  loginWithGoogle: async () => {
    const provider = googleProvider ?? new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    set({ user: result.user });
    await upsertUserDoc(result.user);

    return result;
  },

  /** Login con Facebook */
  loginWithFacebook: async () => {
    const result = await signInWithPopup(auth, facebookProvider);

    set({ user: result.user });
    await upsertUserDoc(result.user);

    return result;
  },

  /** Vincular Google a la cuenta actual */
  linkGoogle: async () => {
    const currentUser = get().user || auth.currentUser;
    if (!currentUser) throw new Error("No hay usuario autenticado para vincular Google.");

    const result = await linkWithPopup(currentUser, googleProvider);
    set({ user: result.user });

    await upsertUserDoc(result.user);
  },

  /** Vincular Facebook a la cuenta actual */
  linkFacebook: async () => {
    const currentUser = get().user || auth.currentUser;
    if (!currentUser) throw new Error("No hay usuario autenticado para vincular Facebook.");

    const result = await linkWithPopup(currentUser, facebookProvider);
    set({ user: result.user });

    await upsertUserDoc(result.user);
  },

  /** Cerrar sesión */
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

export default useAuthStore;
