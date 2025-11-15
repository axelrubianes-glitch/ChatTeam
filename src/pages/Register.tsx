/**
 * @file Register.tsx
 * @description Página de registro de nuevos usuarios (correo/contraseña + redes sociales)
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../lib/firebase.config";
import useAuthStore from "../stores/useAuthStore";

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /** 🔹 Crear usuario con Firebase */
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
        setErrorMsg("Este correo ya está registrado.");
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
    try {
      await loginWithGoogle();
      navigate("/profile");
    } catch {
      setErrorMsg("Error al registrarse con Google.");
    }
  };

  /** 🔹 Registro rápido con Facebook */
  const handleFacebookRegister = async () => {
    try {
      await loginWithFacebook();
      navigate("/profile");
    } catch {
      setErrorMsg("Error al registrarse con Facebook.");
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100 px-4 md:px-8 py-8">
      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden justify-center items-stretch">
        {/* 🔹 Columna izquierda con logo y texto */}
        <div className="flex flex-col justify-center items-center md:items-start bg-gray-50 w-full md:w-[40%] px-8 md:px-10 py-12 md:py-14">
          <img
            src="/logo.png"
            alt="ChatTeam"
            className="w-40 md:w-44 h-40 md:h-44 object-contain mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-3 text-center md:text-left">
            ¡Únete a ChatTeam!
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center md:text-left max-w-xs">
            Crea tu cuenta y empieza a conectarte con tus amigos, compañeros o
            equipos de trabajo desde cualquier lugar.
          </p>
        </div>

        {/* 🔹 Columna derecha con formulario */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-6 md:px-8 py-12">
          <div className="w-full max-w-[380px]">
            <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
              Crear cuenta
            </h2>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {errorMsg && (
                <p className="text-red-500 text-sm text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-2 text-gray-500 text-sm">o continúa con</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Botones sociales */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleRegister}
                className="flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  Registrarse con Google
                </span>
              </button>

              <button
                onClick={handleFacebookRegister}
                className="flex items-center justify-center gap-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all text-white font-medium"
              >
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  className="w-5 h-5"
                />
                <span>Registrarse con Facebook</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
