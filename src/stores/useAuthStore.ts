/**
 * @file useAuthStore.ts
 * @description Zustand global store to manage user authentication state with Firebase.
 */

import { create } from "zustand";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  linkWithPopup,
  type User,
} from "firebase/auth";

import { auth, googleProvider, facebookProvider } from "../lib/firebase.config";

interface AuthState {
  user: User | null;
  loading: boolean;

  // Logins normales
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;

  // Métodos avanzados: vincular proveedores a la cuenta actual
  linkGoogle: () => Promise<void>;
  linkFacebook: () => Promise<void>;

  logout: () => Promise<void>;
  initAuthObserver: () => () => void; // cleanup
}

const useAuthStore = create<AuthState>((set, get) => ({
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
    try {
      console.log("[FB] Abriendo popup...");
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("[FB] Resultado del login con Facebook:", result);
      console.log("[FB] Usuario:", result.user);
      set({ user: result.user });
    } catch (error) {
      console.error("[FB] Error en login con Facebook (store):", error);
      throw error; // importante para que el componente lo capture
    }
  },

  /** Vincular Google a la cuenta actual (link avanzado) */
  linkGoogle: async () => {
    const currentUser = get().user || auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado para vincular Google.");
    }

    const result = await linkWithPopup(currentUser, googleProvider);
    console.log("[LINK] Google vinculado a la cuenta:", result.user);
    set({ user: result.user });
  },

  /** Vincular Facebook a la cuenta actual (link avanzado) */
  linkFacebook: async () => {
    const currentUser = get().user || auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado para vincular Facebook.");
    }

    const result = await linkWithPopup(currentUser, facebookProvider);
    console.log("[LINK] Facebook vinculado a la cuenta:", result.user);
    set({ user: result.user });
  },

  /** Cerrar sesión */
  logout: async () => {
    await signOut(auth);
    set({ user: null });
  },
}));

export default useAuthStore;
