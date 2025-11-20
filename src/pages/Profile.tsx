/**
 * @file Profile.tsx
 * @description Pestañas funcionales: Editar perfil / Control de cuenta
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function Profile() {
  const { user, linkGoogle, linkFacebook, logout } = useAuthStore();
  const [msg, setMsg] = useState<string>("");
  const [name, setName] = useState(user?.displayName || "");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [birthDate, setBirthDate] = useState("");

  // 🔹 NUEVO estado: pestaña activa
  const [activeTab, setActiveTab] = useState<"perfil" | "cuenta">("perfil");

  // 🔹 Campos del control de cuenta
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDeletePassword, setConfirmDeletePassword] = useState("");

  const navigate = useNavigate();

  if (!user) {
    return (
      <section className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">No hay usuario autenticado.</p>
      </section>
    );
  }

  const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");
  const hasFacebook = user.providerData.some(
    (p) => p.providerId === "facebook.com"
  );

  const mainProviderId = user.providerData[0]?.providerId;
  const mainProviderLabel =
    mainProviderId === "google.com"
      ? "Google"
      : mainProviderId === "facebook.com"
      ? "Facebook"
      : "correo y contraseña";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Los cambios fueron guardados correctamente.");
  };

  const handleCancel = () => {
    setName(user.displayName || "");
    setLastName("");
    setEmail(user.email || "");
    setBirthDate("");
    setMsg("");
  };

  const handleSkip = () => navigate("/");

  const handleChangePassword = () => {
    if (!newPassword) {
      setMsg("Por favor, escribe una nueva contraseña.");
      return;
    }
    setMsg("Tu contraseña fue cambiada correctamente. (simulación)");
    setNewPassword("");
  };

  const handleDeleteAccount = () => {
    if (deletePassword !== confirmDeletePassword) {
      setMsg("Las contraseñas no coinciden. Intenta nuevamente.");
      return;
    }
    setMsg("Cuenta eliminada correctamente. (simulación)");
    setDeletePassword("");
    setConfirmDeletePassword("");
  };

  // ==============================
  // 🔹 Render principal
  // ==============================
  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-4 py-16">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-10 md:p-12 text-gray-800 animate-fade-in">
        {/* ==== Tabs superiores ==== */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "perfil"
                ? "text-blue-700 border-b-4 border-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            Editar perfil
          </button>
          <button
            onClick={() => setActiveTab("cuenta")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "cuenta"
                ? "text-blue-700 border-b-4 border-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
          >
            Control de cuenta
          </button>
        </div>

        {/* ==== Contenido: Editar perfil ==== */}
        {activeTab === "perfil" && (
          <>
            <form
              onSubmit={handleSave}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
            >
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Nombre
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Apellido
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-10">
              <button
                type="submit"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:scale-[1.02]"
              >
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all shadow-sm hover:scale-[1.02]"
              >
                Cancelar
              </button>
            </div>
          </>
        )}

        {/* ==== Contenido: Control de cuenta ==== */}
        {activeTab === "cuenta" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14">
            {/* Cambiar contraseña */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">
                Cambiar contraseña
              </h3>

              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-600 cursor-not-allowed"
              />

              <label className="block text-gray-700 font-semibold mb-2 text-sm mt-4">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleChangePassword}
                className="mt-5 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:scale-[1.03]"
              >
                Cambiar
              </button>
            </div>

            {/* Eliminar cuenta */}
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Eliminar cuenta</h3>

              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Contraseña
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              />

              <label className="block text-gray-700 font-semibold mb-2 text-sm mt-4">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmDeletePassword}
                onChange={(e) => setConfirmDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
              />

              <button
                onClick={handleDeleteAccount}
                className="mt-5 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:scale-[1.03]"
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        )}

        {/* ==== Bloque inferior (sin tocar) ==== */}
        <h2 className="text-2xl font-bold mb-2 text-gray-900">
          Perfil de usuario
        </h2>
        <p className="text-gray-600 mb-1">
          Sesión iniciada como{" "}
          <span className="font-semibold">
            {user.displayName || user.email}
          </span>
        </p>
        <p className="text-gray-500 mb-4 text-sm">
          Estás usando{" "}
          <span className="font-semibold">{mainProviderLabel}</span>.
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
          {!hasGoogle && (
            <button
              onClick={linkGoogle}
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

          {!hasFacebook && (
            <button
              onClick={linkFacebook}
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
