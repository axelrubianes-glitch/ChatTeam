// src/pages/Profile.tsx
import { useMemo, useState } from "react";
import useAuthStore from "../stores/useAuthStore";

type ActiveTab = "profile" | "account";

export default function Profile() {
  const { user, linkGoogle, linkFacebook, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [msg, setMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ==========================
  //  Datos iniciales del usuario
  // ==========================
  const fullName = user?.displayName || "";
  const emailFromUser = user?.email || "";

  const [firstName, setFirstName] = useState<string>(() => {
    const [first = ""] = fullName.split(" ");
    return first;
  });

  const [lastName, setLastName] = useState<string>(() => {
    const parts = fullName.split(" ");
    parts.shift();
    return parts.join(" ");
  });

  const [email, setEmail] = useState<string>(emailFromUser);
  const [birthDate, setBirthDate] = useState<string>(""); // DD/MM/AA por ahora

  // Campos ficticios para "control de cuenta"
  const [changeEmail, setChangeEmail] = useState(emailFromUser);
  const [changePassword, setChangePassword] = useState("");
  const [changePasswordConfirm, setChangePasswordConfirm] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState("");

  // ==========================
  //  Info de proveedores vinculados
  // ==========================
  const { hasGoogle, hasFacebook } = useMemo(() => {
    const providers = user?.providerData?.map((p) => p.providerId) || [];
    return {
      hasGoogle: providers.includes("google.com"),
      hasFacebook: providers.includes("facebook.com"),
    };
  }, [user]);

  if (!user) {
    return (
      <section className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            No hay usuario autenticado
          </h1>
          <p className="text-gray-600 mb-4">
            Inicia sesión para acceder a la configuración de tu perfil.
          </p>
          {/* Aquí podrías poner un Link a /login si quieres */}
        </div>
      </section>
    );
  }

  // ==========================
  //  Handlers de pestañas
  // ==========================
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Los cambios se guardaron.");
    setErrorMsg("");
    // Aquí luego conectarás con tu backend / Firebase para actualizar el perfil
    console.log("Guardar perfil:", { firstName, lastName, email, birthDate });
  };

  const handleCancelProfile = () => {
    // Solo resetea a los valores iniciales del user (por ahora)
    setFirstName(() => {
      const [first = ""] = fullName.split(" ");
      return first;
    });
    setLastName(() => {
      const parts = fullName.split(" ");
      parts.shift();
      return parts.join(" ");
    });
    setEmail(emailFromUser);
    setBirthDate("");
    setMsg("");
    setErrorMsg("");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Función de cambio de contraseña pendiente de backend.");
    setErrorMsg("");
    console.log("Cambiar contraseña:", {
      changeEmail,
      changePassword,
      changePasswordConfirm,
    });
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    // Solo UI: todavía NO se borra nada
    if (deletePassword !== deletePasswordConfirm) {
      setErrorMsg("Las contraseñas para eliminar la cuenta no coinciden.");
      setMsg("");
      return;
    }
    setMsg(
      "Simulación: aquí se eliminaría la cuenta una vez se implemente el backend."
    );
    setErrorMsg("");
    console.log("Eliminar cuenta:", { deletePassword, deletePasswordConfirm });
  };

  // ==========================
  //  Handlers de vinculación social
  // ==========================
  const handleLinkGoogle = async () => {
    setMsg("");
    setErrorMsg("");
    try {
      await linkGoogle();
      setMsg("Google se vinculó correctamente a tu cuenta.");
    } catch (err: any) {
      console.error("Error al vincular Google:", err);
      setErrorMsg("No se pudo vincular Google. Intenta de nuevo.");
    }
  };

  const handleLinkFacebook = async () => {
    setMsg("");
    setErrorMsg("");
    try {
      await linkFacebook();
      setMsg("Facebook se vinculó correctamente a tu cuenta.");
    } catch (err: any) {
      console.error("Error al vincular Facebook:", err);
      setErrorMsg("No se pudo vincular Facebook. Intenta de nuevo.");
    }
  };

  // ==========================
  //  Render
  // ==========================
  return (
    <section className="flex justify-center items-start min-h-screen bg-gray-50 px-4 py-16">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl px-8 md:px-10 py-8 md:py-10">
        {/* Título principal */}
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Perfil de usuario
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Sesión iniciada como{" "}
            <span className="font-semibold">
              {user.displayName || user.email}
            </span>
            .
          </p>
        </header>

        {/* Tabs estilo Figma */}
        <div className="flex border-b border-gray-200 mb-6 gap-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Editar perfil
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === "account"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Control de cuenta
          </button>
        </div>

        {/* Mensajes generales */}
        {(msg || errorMsg) && (
          <div className="mb-6 space-y-2">
            {msg && (
              <div className="px-4 py-3 rounded-lg bg-blue-50 text-blue-800 text-sm">
                {msg}
              </div>
            )}
            {errorMsg && (
              <div className="px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Layout principal: formulario + servicios vinculados */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-8">
          {/* ====== Columna izquierda: contenido de pestañas ====== */}
          <div>
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nombres
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="Tus nombres"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="Tus apellidos"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="max-w-xs">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    placeholder="DD/MM/AA"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelProfile}
                    className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold shadow-sm transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {activeTab === "account" && (
              <div className="space-y-8">
                {/* Cambiar contraseña */}
                <form
                  onSubmit={handleChangePassword}
                  className="bg-gray-50 rounded-2xl px-4 py-4 md:px-6 md:py-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Cambiar contraseña
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                        value={changeEmail}
                        onChange={(e) => setChangeEmail(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                          value={changePassword}
                          onChange={(e) =>
                            setChangePassword(e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                          value={changePasswordConfirm}
                          onChange={(e) =>
                            setChangePasswordConfirm(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 inline-flex justify-center items-center px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Cambiar
                    </button>
                  </div>
                </form>

                {/* Eliminar cuenta */}
                <form
                  onSubmit={handleDeleteAccount}
                  className="bg-gray-50 rounded-2xl px-4 py-4 md:px-6 md:py-5 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Eliminar cuenta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                        value={deletePassword}
                        onChange={(e) =>
                          setDeletePassword(e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-all"
                        value={deletePasswordConfirm}
                        onChange={(e) =>
                          setDeletePasswordConfirm(e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-3 inline-flex justify-center items-center px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Eliminar cuenta
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ====== Columna derecha: Servicios vinculados + logout ====== */}
          <aside className="space-y-4">
            <div className="border border-gray-200 rounded-2xl px-5 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Servicios vinculados
              </h3>

              <p className="text-xs text-gray-600 mb-4">
                Estás usando{" "}
                <span className="font-semibold">
                  {user.providerData[0]?.providerId === "password"
                    ? "correo y contraseña"
                    : user.providerData[0]?.providerId === "google.com"
                    ? "Google"
                    : user.providerData[0]?.providerId === "facebook.com"
                    ? "Facebook"
                    : "un método de autenticación"}
                </span>
                . Puedes añadir otros métodos al mismo correo.
              </p>

              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={handleLinkGoogle}
                  disabled={hasGoogle}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    hasGoogle
                      ? "border-green-200 bg-green-50 text-green-700 cursor-not-allowed"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>
                    {hasGoogle
                      ? "Google ya está vinculado"
                      : "Conectar Google a mi cuenta"}
                  </span>
                </button>

                {/* Facebook */}
                <button
                  onClick={handleLinkFacebook}
                  disabled={hasFacebook}
                  className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    hasFacebook
                      ? "bg-blue-50 text-blue-700 border border-blue-100 cursor-not-allowed"
                      : "bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  <img
                    src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                    alt="Facebook"
                    className="w-5 h-5"
                  />
                  <span>
                    {hasFacebook
                      ? "Facebook ya está vinculado"
                      : "Conectar Facebook a mi cuenta"}
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full py-3 rounded-xl border border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all"
            >
              Cerrar sesión
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}