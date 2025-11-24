// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { auth, db } from "../lib/firebase.config";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

type Tab = "profile" | "security";

/** Separa mejor el displayName en nombres y apellidos */
function splitDisplayName(displayName: string): { first: string; last: string } {
  const clean = (displayName || "").trim();
  if (!clean) return { first: "", last: "" };

  const parts = clean.split(/\s+/);

  // 1 sola palabra: solo nombre
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }

  // 2 palabras: nombre + apellido
  if (parts.length === 2) {
    return { first: parts[0], last: parts[1] };
  }

  // 3 o más palabras: asumimos 2 nombres y el resto apellidos
  return {
    first: parts.slice(0, 2).join(" "), // ej: "Juan Carlos"
    last: parts.slice(2).join(" "), // ej: "Villa Gallego"
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading, logout, linkGoogle, linkFacebook } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // ----- Estados de "Editar perfil" -----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<string>(""); // Edad
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ----- Estados de "Cambiar contraseña" -----
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // ----- Estados de "Eliminar cuenta" -----
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ----- Estados de servicios vinculados -----
  const [providerMsg, setProviderMsg] = useState("");
  const [providerError, setProviderError] = useState("");

  const hasGoogle = !!user?.providerData.find(
    (p) => p.providerId === "google.com"
  );
  const hasFacebook = !!user?.providerData.find(
    (p) => p.providerId === "facebook.com"
  );
  const hasPassword = !!user?.providerData.find(
    (p) => p.providerId === "password"
  );

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Rellenar los campos cuando cargue el usuario (Auth + Backend + Firestore)
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      // 1) Datos base desde Firebase Auth
      const { first, last } = splitDisplayName(user.displayName || "");
      setFirstName(first);
      setLastName(last);
      setEmail(user.email || "");

      // 2) Intentar traer datos desde tu backend (registro manual)
      try {
        const res = await fetch(
          `http://localhost:4000/api/users/${user.uid}`
        );
        if (res.ok) {
          const data = (await res.json()) as any;

          if (data.name) {
            const { first: bf, last: bl } = splitDisplayName(data.name);
            setFirstName(bf || first);
            setLastName(bl || last);
          }

          if (data.age !== undefined && data.age !== null) {
            setAge(String(data.age));
          }
        }
      } catch (err) {
        console.error("[PROFILE] Error cargando datos del backend:", err);
      }

      // 3) Sobrescribir con lo que haya en Firestore (para compatibilidad)
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as any;

          if (data.firstName || data.lastName) {
            setFirstName(data.firstName ?? first);
            setLastName(data.lastName ?? last);
          }

          if (data.age !== undefined && data.age !== null) {
            setAge(String(data.age));
          }
        }
      } catch (err) {
        console.error("[PROFILE] Error cargando datos de Firestore:", err);
      }
    };

    loadProfile();
  }, [user]);

  // ============================
  // 1) EDITAR PERFIL
  // ============================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");

    if (!auth.currentUser) {
      setProfileError("No hay sesión activa.");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setProfileError("Escribe tus nombres y apellidos.");
      return;
    }

    let ageNumber: number | null = null;
    if (age) {
      ageNumber = Number(age);
      if (Number.isNaN(ageNumber) || ageNumber <= 0) {
        setProfileError("Ingresa una edad válida.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // 1) Actualizar nombre en Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: fullName,
      });

      // 2) Guardar datos extra en Firestore
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            ...(ageNumber !== null ? { age: ageNumber } : {}),
          },
          { merge: true }
        );
      } catch (firestoreError) {
        console.error(
          "[PROFILE] Error al actualizar datos extra en Firestore:",
          firestoreError
        );
      }

      // 3) Actualizar también en tu backend
      try {
        await fetch(
          `http://localhost:4000/api/users/${auth.currentUser.uid}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: auth.currentUser.uid,
              email: email.trim(),
              name: fullName,
              age: ageNumber,
            }),
          }
        );
      } catch (backendError) {
        console.error(
          "[PROFILE] Error al sincronizar con backend:",
          backendError
        );
      }

      setProfileMsg("Perfil actualizado correctamente.");
    } catch (error) {
      console.error("[PROFILE] Error al actualizar perfil (Auth):", error);
      setProfileError(
        "No se pudo actualizar tu perfil. Intenta nuevamente en unos segundos."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================
  // 2) CAMBIAR CONTRASEÑA (solo password)
  // ============================
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (!auth.currentUser) {
      setPasswordError("No hay sesión activa.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setChangingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg("Tu contraseña se actualizó correctamente.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error: any) {
      console.error("[PASSWORD] Error al cambiar contraseña:", error);
      if (error.code === "auth/requires-recent-login") {
        setPasswordError(
          "Por seguridad, vuelve a iniciar sesión y luego intenta cambiar tu contraseña."
        );
      } else {
        setPasswordError(
          "No se pudo cambiar la contraseña. Intenta nuevamente."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  };

  // ============================
  // 3) ELIMINAR CUENTA
  // ============================
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteMsg("");
    setDeleteError("");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDeleteError("No hay sesión activa.");
      return;
    }

    if (!deletePassword) {
      setDeleteError("Escribe tu contraseña para confirmar.");
      return;
    }

    if (deletePassword !== deleteConfirmPassword) {
      setDeleteError("Las contraseñas no coinciden.");
      return;
    }

    const uid = currentUser.uid; // 👈 guardamos el UID antes de borrar

    setDeleting(true);
    try {
      if (currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          deletePassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // 1) Borrar usuario en Auth
      await deleteUser(currentUser);

      // 2) Intentar borrar documento en Firestore
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (err) {
        console.error("[DELETE] Error al borrar doc en Firestore:", err);
      }

      // 3) Intentar borrar en tu backend
      try {
        await fetch(`http://localhost:4000/api/users/${uid}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("[DELETE] Error al borrar usuario en backend:", err);
      }

      setDeleteMsg("Tu cuenta ha sido eliminada correctamente.");
      await logout();
      navigate("/");
    } catch (error: any) {
      console.error("[DELETE] Error al eliminar cuenta:", error);
      if (error.code === "auth/wrong-password") {
        setDeleteError("La contraseña es incorrecta.");
      } else if (error.code === "auth/requires-recent-login") {
        setDeleteError(
          "Por seguridad, vuelve a iniciar sesión y luego intenta eliminar tu cuenta."
        );
      } else {
        setDeleteError(
          "No se pudo eliminar la cuenta. Intenta nuevamente en unos segundos."
        );
      }
    } finally {
      setDeleting(false);
    }
  };


  // Eliminar cuenta para Google / Facebook
  const handleDeleteAccountProvider = async () => {
    setDeleteMsg("");
    setDeleteError("");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDeleteError("No hay sesión activa.");
      return;
    }

    const uid = currentUser.uid; // 👈 guardamos el UID

    setDeleting(true);
    try {
      let provider;

      if (hasGoogle) {
        provider = new GoogleAuthProvider();
      } else if (hasFacebook) {
        provider = new FacebookAuthProvider();
      } else {
        setDeleteError(
          "No se pudo detectar el proveedor de tu cuenta. Cierra sesión y vuelve a entrar."
        );
        setDeleting(false);
        return;
      }

      // 1) Reautenticar con popup del proveedor
      await reauthenticateWithPopup(currentUser, provider);

      // 2) Borrar usuario en Auth
      await deleteUser(currentUser);

      // 3) Intentar borrar documento en Firestore
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (err) {
        console.error("[DELETE] Error al borrar doc en Firestore:", err);
      }

      // 4) Intentar borrar en tu backend
      try {
        await fetch(`http://localhost:4000/api/users/${uid}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("[DELETE] Error al borrar usuario en backend:", err);
      }

      setDeleteMsg("Tu cuenta ha sido eliminada correctamente.");
      await logout();
      navigate("/");
    } catch (error: any) {
      console.error("[DELETE] Error al eliminar cuenta con proveedor:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setDeleteError("Cerraste la ventana antes de terminar. Intenta de nuevo.");
      } else if (error.code === "auth/requires-recent-login") {
        setDeleteError(
          "Por seguridad, vuelve a iniciar sesión y luego intenta eliminar tu cuenta."
        );
      } else {
        setDeleteError(
          "No se pudo eliminar la cuenta. Intenta nuevamente en unos segundos."
        );
      }
    } finally {
      setDeleting(false);
    }
  };


  // ============================
  // 4) SERVICIOS VINCULADOS
  // ============================
  const handleLinkGoogle = async () => {
    setProviderMsg("");
    setProviderError("");
    try {
      await linkGoogle();
      setProviderMsg("Google se vinculó correctamente a tu cuenta.");
    } catch (error: any) {
      console.error("[LINK GOOGLE]", error);
      if (
        error.code === "auth/credential-already-in-use" ||
        error.code === "auth/email-already-in-use"
      ) {
        setProviderError(
          "Este correo ya está utilizado en otra cuenta. No se pudo vincular Google."
        );
      } else {
        setProviderError(
          "No se pudo vincular Google en este momento. Intenta más tarde."
        );
      }
    }
  };

  const handleLinkFacebook = async () => {
    setProviderMsg("");
    setProviderError("");
    try {
      await linkFacebook();
      setProviderMsg("Facebook se vinculó correctamente a tu cuenta.");
    } catch (error: any) {
      console.error("[LINK FACEBOOK]", error);
      if (
        error.code === "auth/credential-already-in-use" ||
        error.code === "auth/email-already-in-use"
      ) {
        setProviderError(
          "Este correo ya está utilizado en otra cuenta. No se pudo vincular Facebook."
        );
      } else {
        setProviderError(
          "No se pudo vincular Facebook en este momento. Intenta más tarde."
        );
      }
    }
  };

  // ============================
  // 5) LOGOUT
  // ============================
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen w-full bg-gray-50 px-4 md:px-8 py-24 md:py-28 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl p-6 md:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Perfil de usuario
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Sesión iniciada como{" "}
          <span className="font-semibold">{user.displayName || user.email}</span>.
        </p>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm">
          <button
            className={`pb-3 border-b-2 ${activeTab === "profile"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab("profile")}
          >
            Editar perfil
          </button>
          <button
            className={`pb-3 border-b-2 ${activeTab === "security"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab("security")}
          >
            Control de cuenta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8">
          {/* Columna izquierda */}
          <div className="space-y-8">
            {activeTab === "profile" && (
              <form
                onSubmit={handleSaveProfile}
                className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100"
              >
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Información básica
                </h2>

                {profileError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                    {profileError}
                  </div>
                )}
                {profileMsg && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                    {profileMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                    value={email}
                    disabled
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <>
                {/* Cambiar contraseña */}
                {hasPassword ? (
                  <form
                    onSubmit={handleChangePassword}
                    className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100"
                  >
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">
                      Cambiar contraseña
                    </h2>

                    {passwordError && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                        {passwordError}
                      </div>
                    )}
                    {passwordMsg && (
                      <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                        {passwordMsg}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">
                      Cambiar contraseña
                    </h2>
                    <p className="text-sm text-gray-600">
                      Tu cuenta está conectada con{" "}
                      <span className="font-semibold">
                        {hasGoogle
                          ? "Google"
                          : hasFacebook
                            ? "Facebook"
                            : "un proveedor externo"}
                      </span>
                      .
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      La contraseña se gestiona desde ese servicio. Entra a la
                      configuración de seguridad de{" "}
                      {hasGoogle ? "tu cuenta de Google" : "tu cuenta de Facebook"}{" "}
                      para cambiarla.
                    </p>
                  </div>
                )}

                {/* Eliminar cuenta */}
                {hasPassword ? (
                  <form
                    onSubmit={handleDeleteAccount}
                    className="bg-red-50 rounded-2xl p-5 md:p-6 border border-red-100"
                  >
                    <h2 className="text-lg font-semibold mb-4 text-red-700">
                      Eliminar cuenta
                    </h2>

                    {deleteError && (
                      <div className="mb-4 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
                        {deleteError}
                      </div>
                    )}
                    {deleteMsg && (
                      <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                        {deleteMsg}
                      </div>
                    )}

                    <p className="text-sm text-red-800 mb-4">
                      Esta acción es permanente. Se eliminarán tus datos de
                      acceso. Escribe tu contraseña para confirmar.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-red-800 mb-1">
                          Contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-red-800 mb-1">
                          Confirmar contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white border border-red-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          value={deleteConfirmPassword}
                          onChange={(e) =>
                            setDeleteConfirmPassword(e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={deleting}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? "Eliminando..." : "Eliminar cuenta"}
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDeleteAccountProvider();
                    }}
                    className="bg-red-50 rounded-2xl p-5 md:p-6 border border-red-100"
                  >
                    <h2 className="text-lg font-semibold mb-4 text-red-700">
                      Eliminar cuenta
                    </h2>

                    {deleteError && (
                      <div className="mb-4 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-3">
                        {deleteError}
                      </div>
                    )}
                    {deleteMsg && (
                      <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                        {deleteMsg}
                      </div>
                    )}

                    <p className="text-sm text-red-800 mb-4">
                      Tu cuenta está conectada con{" "}
                      <span className="font-semibold">
                        {hasGoogle
                          ? "Google"
                          : hasFacebook
                            ? "Facebook"
                            : "un proveedor externo"}
                      </span>
                      . Para eliminarla, primero confirmaremos tu identidad con
                      ese servicio.
                    </p>

                    <button
                      type="submit"
                      disabled={deleting}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? "Eliminando..." : "Eliminar cuenta"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Columna derecha: servicios vinculados + logout */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-2 text-gray-900">
                Servicios vinculados
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Puedes añadir o revisar los métodos que usas para entrar a
                ChatTeam.
              </p>

              {providerError && (
                <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2">
                  {providerError}
                </div>
              )}
              {providerMsg && (
                <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2">
                  {providerMsg}
                </div>
              )}

              {/* Google */}
              <button
                type="button"
                onClick={hasGoogle ? undefined : handleLinkGoogle}
                disabled={hasGoogle}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm mb-3 ${hasGoogle
                    ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      className="w-4 h-4"
                    />
                  </span>
                  {hasGoogle
                    ? "Google ya está vinculado"
                    : "Conectar Google a mi cuenta"}
                </span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={hasFacebook ? undefined : handleLinkFacebook}
                disabled={hasFacebook}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${hasFacebook
                    ? "bg-blue-50 border-blue-200 text-blue-700 cursor-default"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <img
                      src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook"
                      className="w-4 h-4"
                    />
                  </span>

                  {hasFacebook
                    ? "Facebook ya está vinculado"
                    : "Conectar Facebook a mi cuenta"}
                </span>
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 md:p-6 border border-red-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-md"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
