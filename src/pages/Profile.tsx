// src/pages/Profile.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function Profile() {
  const { user, linkGoogle, linkFacebook, logout } = useAuthStore();
  const [msg, setMsg] = useState<string>("");
  const navigate = useNavigate();

  if (!user) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No hay usuario autenticado.</p>
      </section>
    );
  }

  // ✅ Revisar qué proveedores tiene vinculados este usuario
  const hasGoogle = user.providerData.some(
    (p) => p.providerId === "google.com"
  );
  const hasFacebook = user.providerData.some(
    (p) => p.providerId === "facebook.com"
  );

  // Para mostrar un texto amigable del proveedor principal
  const mainProviderId = user.providerData[0]?.providerId;
  const mainProviderLabel =
    mainProviderId === "google.com"
      ? "Google"
      : mainProviderId === "facebook.com"
      ? "Facebook"
      : "correo y contraseña";

  const handleLinkGoogle = async () => {
    setMsg("");
    try {
      await linkGoogle();
      setMsg("Google se vinculó correctamente a tu cuenta.");
    } catch (err: any) {
      console.error("Error al vincular Google:", err);
      setMsg("No se pudo vincular Google. Intenta nuevamente.");
    }
  };

  const handleLinkFacebook = async () => {
    setMsg("");
    try {
      await linkFacebook();
      setMsg("Facebook se vinculó correctamente a tu cuenta.");
    } catch (err: any) {
      console.error("Error al vincular Facebook:", err);
      setMsg("No se pudo vincular Facebook. Intenta nuevamente.");
    }
  };

  const handleSkip = () => {
    navigate("/"); // te lleva al home sin cerrar sesión
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">
          Perfil de usuario
        </h1>

        <p className="text-gray-600 mb-1">
          Sesión iniciada como{" "}
          <span className="font-semibold">
            {user.displayName || user.email}
          </span>
        </p>
        <p className="text-gray-500 mb-4 text-sm">
          Estás usando <span className="font-semibold">{mainProviderLabel}</span>.
          {hasGoogle && hasFacebook
            ? " Ya tienes Google y Facebook vinculados a este correo."
            : " Si quieres, puedes vincular también otro método a este mismo correo."}
        </p>

        {msg && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-blue-50 text-blue-800">
            {msg}
          </div>
        )}

        <div className="space-y-3">
          {/* 🔹 SOLO mostrar botón de Google si aún NO está vinculado */}
          {!hasGoogle && (
            <button
              onClick={handleLinkGoogle}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Conectar Google a mi cuenta</span>
            </button>
          )}

          {/* 🔹 SOLO mostrar botón de Facebook si aún NO está vinculado */}
          {!hasFacebook && (
            <button
              onClick={handleLinkFacebook}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium hover:scale-[1.02] shadow-md transition-all"
            >
              <img
                src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                alt="Facebook"
                className="w-5 h-5"
              />
              <span>Conectar Facebook a mi cuenta</span>
            </button>
          )}

          {/* Si ya tiene todo vinculado, puedes mostrar un mensajito extra si quieres */}
          {hasGoogle && hasFacebook && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Ya tienes vinculados Google y Facebook a tu cuenta.
            </p>
          )}
        </div>

        <button
          onClick={handleSkip}
          className="mt-6 w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
        >
          No quiero vincular más cuentas ahora
        </button>

        <button
          onClick={logout}
          className="mt-3 w-full py-2.5 rounded-xl border border-red-300 text-red-600 font-semibold hover:bg-red-50 transition-all text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
