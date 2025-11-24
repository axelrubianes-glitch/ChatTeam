// src/pages/RecoverPassword.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase.config"; // 👈 ajusta la ruta si tu archivo está en otro lado

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMsg("");
    setErrorMsg("");

    if (!email) {
      setErrorMsg("Por favor ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);

    try {
      // ✅ AQUÍ se manda el correo real desde Firebase
      await sendPasswordResetEmail(auth, email);

      setInfoMsg(
        "Si este correo está registrado, te enviamos un enlace para restablecer tu contraseña."
      );
    } catch (error: any) {
      console.error(error);

      // Mensajes más claros según el error de Firebase
      if (error.code === "auth/user-not-found") {
        // Ojo: por seguridad muchas apps no revelan esto
        setErrorMsg(
          "Si este correo está registrado, te enviaremos un enlace para restablecer tu contraseña."
        );
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("El correo ingresado no es válido.");
      } else {
        setErrorMsg("Error al intentar enviar el enlace. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 md:px-8 py-32 md:py-40">
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* Columna izquierda (branding) */}
        <div className="relative flex flex-col justify-center items-center md:items-start bg-gradient-to-br from-blue-600 to-purple-600 w-full md:w-[40%] px-10 py-16 md:py-20 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />

          <div className="relative z-10">
            <div className="bg-white p-4 rounded-2xl shadow-lg mb-6 w-fit">
              <img
                src="/logo.png"
                alt="ChatTeam"
                className="w-32 h-32 object-contain"
              />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
              Recuperar contraseña
            </h1>

            <p className="text-blue-100 text-base leading-relaxed max-w-xs">
              Te ayudamos a recuperar el acceso a tu cuenta de forma rápida y
              segura.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Enlace seguro enviado a tu correo</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>No compartas el enlace con nadie</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-8 md:px-12 py-12 md:py-16 bg-white">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="text-gray-500 mb-8">
              Ingresa el correo asociado a tu cuenta y te enviaremos un enlace
              para crear una nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              {infoMsg && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                  {infoMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {loading ? "Enviando enlace..." : "Enviar enlace"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
