/**
 * @file useAuthStore.ts
 * @description Zustand global store to manage user authentication state with Firebase.
 */

import { create } from "zustand";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth"; // 👈 ESTA es la línea clave
import { auth, googleProvider, facebookProvider } from "../lib/firebase.config";

interface AuthState {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  initAuthObserver: () => () => void; // el retorno es la función de cleanup
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  /** Detecta automáticamente si hay un usuario autenticado */
  initAuthObserver: () => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      set({ user: currentUser, loading: false });
    });
    return unsubscribe;
  },

  /** Login con Google */
  loginWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    set({ user: result.user });
  },

  /** Login con Facebook */
  loginWithFacebook: async () => {
    const result = await signInWithPopup(auth, facebookProvider);
    set({ user: result.user });
  },

  /** Cerrar sesión */
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

export default useAuthStore;
