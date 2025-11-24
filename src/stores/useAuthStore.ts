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
import { auth, googleProvider, facebookProvider } from "../lib/firebase.config";

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
    // Puedes usar googleProvider directamente, pero así también vale:
    const provider = googleProvider ?? new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    set({ user: result.user });
    return result; // 👈 IMPORTANTE para el registro
  },

  /** Login con Facebook */
  loginWithFacebook: async () => {
    const result = await signInWithPopup(auth, facebookProvider);
    set({ user: result.user });
    return result;
  },

  /** Vincular Google a la cuenta actual */
  linkGoogle: async () => {
    const currentUser = get().user || auth.currentUser;
    if (!currentUser) {
      throw new Error("No hay usuario autenticado para vincular Google.");
    }

    const result = await linkWithPopup(currentUser, googleProvider);
    console.log("[LINK] Google vinculado a la cuenta:", result.user);
    set({ user: result.user });
  },

  /** Vincular Facebook a la cuenta actual */
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
