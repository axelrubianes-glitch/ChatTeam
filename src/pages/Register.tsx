/**
 * @file Register.tsx
 * @description Página de registro de nuevos usuarios (correo/contraseña + redes sociales)
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  facebookProvider,
} from "../lib/firebase.config";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /** 🔹 Crear usuario con correo / contraseña */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: name });
      navigate("/profile");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg(
          "Este correo ya está registrado. Ve a 'Iniciar sesión' y entra con tu contraseña."
        );
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("El correo electrónico no es válido.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setErrorMsg("Error al crear la cuenta. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Registro rápido con Google */
  const handleGoogleRegister = async () => {
    setErrorMsg("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const info = getAdditionalUserInfo(result);

      if (info?.isNewUser) {
        // Usuario NUEVO con Google → lo mandamos a perfil para vincular si quiere
        navigate("/profile");
      } else {
        // Ya existía una cuenta con ese Google
        setErrorMsg(
          "Ya tienes una cuenta registrada con este correo usando Google. " +
            "No necesitas registrarte de nuevo: usa la opción 'Iniciar sesión' con Google."
        );
      }
    } catch (err: any) {
      console.error("[REGISTER] Error con Google:", err);
      const code = err?.code || "error-desconocido";

      if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Google antes de terminar el proceso."
        );
      } else {
        setErrorMsg("No se pudo completar el registro con Google.");
      }
    }
  };

  /** 🔹 Registro rápido con Facebook */
  const handleFacebookRegister = async () => {
    setErrorMsg("");

    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const info = getAdditionalUserInfo(result);

      if (info?.isNewUser) {
        // Usuario NUEVO con Facebook
        navigate("/profile");
      } else {
        // Ya existía una cuenta con ese Facebook
        setErrorMsg(
          "Ya tienes una cuenta registrada con este correo usando Facebook. " +
            "No necesitas registrarte de nuevo: usa la opción 'Iniciar sesión' con Facebook."
        );
      }
    } catch (err: any) {
      console.error("[REGISTER] Error con Facebook:", err);
      const code = err?.code || "error-desconocido";

      if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Facebook antes de terminar el proceso."
        );
      } else {
        setErrorMsg("No se pudo completar el registro con Facebook.");
      }
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 md:px-8 py-32 md:py-40">
      {/* 🔹 Contenedor principal con animación y mejor espaciado */}
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* 🔹 Columna izquierda (branding) */}
        <div className="relative flex flex-col justify-center items-center md:items-start bg-gradient-to-br from-purple-600 to-blue-600 w-full md:w-[40%] px-10 py-16 md:py-20 text-white overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-6 w-fit">
              <img
                src="/logo.png"
                alt="ChatTeam"
                className="w-32 h-32 object-contain"
              />
            </div>

            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              ¡Únete a ChatTeam!
            </h1>

            <p className="text-blue-100 text-base leading-relaxed max-w-xs">
              Crea tu cuenta y empieza a conectarte con tus amigos, compañeros o
              equipos de trabajo desde cualquier lugar del mundo.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Registro rápido y sencillo</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Totalmente gratis</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl"></span>
                <span>Sin límites de reuniones</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-8 md:px-12 py-12 md:py-16 bg-white">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crear cuenta
            </h2>
            <p className="text-gray-500 mb-8">
              Completa tus datos para comenzar
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3.5 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>

            {/* Separador mejorado */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">
                o regístrate con
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Botones sociales mejorados */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleRegister}
                className="flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-[1.02] font-medium"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-gray-700">Registrarse con Google</span>
              </button>

              <button
                onClick={handleFacebookRegister}
                className="flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-all text-white font-medium hover:scale-[1.02] shadow-md"
              >
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  className="w-5 h-5"
                />
                <span>Registrarse con Facebook</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
