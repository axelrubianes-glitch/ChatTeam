/**
 * @file Register.tsx
 * @description Página de registro de nuevos usuarios (correo/contraseña + redes sociales)
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth, db } from "../lib/firebase.config"; // 👈 añadimos db
import { doc, setDoc } from "firebase/firestore"; // 👈 Firestore
import useAuthStore from "../stores/useAuthStore";
import { API_BASE } from "../lib/api";

type FieldErrors = {
  firstName: string;
  lastName: string;
  age: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const EMPTY_ERRORS: FieldErrors = {
  firstName: "",
  lastName: "",
  age: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();

  const [firstName, setFirstName] = useState(""); // Nombres
  const [lastName, setLastName] = useState(""); // Apellidos
  const [age, setAge] = useState(""); // Edad
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [loading, setLoading] = useState(false);

  // 👁️ estados para mostrar / ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /** 🔹 Crear usuario con correo + contraseña */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    let hasError = false;
    const newErrors: FieldErrors = { ...EMPTY_ERRORS };

    // Validación nombres
    if (!firstName.trim()) {
      newErrors.firstName = "Por favor escribe tus nombres.";
      hasError = true;
    }

    // Validación apellidos
    if (!lastName.trim()) {
      newErrors.lastName = "Por favor escribe tus apellidos.";
      hasError = true;
    }

    // Validación edad
    if (!age) {
      newErrors.age = "Por favor ingresa tu edad.";
      hasError = true;
    } else {
      const ageNumber = Number(age);
      if (Number.isNaN(ageNumber) || ageNumber < 10 || ageNumber > 120) {
        newErrors.age = "Ingresa una edad válida (entre 10 y 120 años).";
        hasError = true;
      }
    }

    // Validación correo
    if (!email.trim()) {
      newErrors.email = "Por favor ingresa tu correo electrónico.";
      hasError = true;
    }

    // Validación contraseña
    if (!password) {
      newErrors.password = "Por favor ingresa una contraseña.";
      hasError = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña.";
      hasError = true;
    } else if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      setLoading(false);
      return;
    }

    // Si llega aquí, las validaciones están bien
    setFieldErrors(EMPTY_ERRORS);
    const ageNumber = Number(age);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      // 1) displayName en Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: fullName || undefined,
      });

      // 2) Guardar datos en Firestore
      await setDoc(
        doc(db, "users", userCredential.user.uid),
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: userCredential.user.email,
          age: ageNumber,
        },
        { merge: true }
      );

      // 3) También al backend (opcional)

try {
  await fetch(`${API_BASE}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      name: fullName,
      age: ageNumber,
    }),
  });
} catch (syncError) {
  console.error("[REGISTER] Error sincronizando con backend:", syncError);
}

      navigate("/profile");
    } catch (error: any) {
      console.error("[REGISTER] Error email/pass:", error);
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg(
          "Este correo ya está registrado. Ve a 'Iniciar sesión' para acceder a tu cuenta."
        );
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("El correo electrónico no es válido.");
        setFieldErrors((prev) => ({
          ...prev,
          email: "El formato de correo no es válido.",
        }));
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
        setFieldErrors((prev) => ({
          ...prev,
          password: "La contraseña debe tener al menos 6 caracteres.",
        }));
      } else {
        setErrorMsg("Error al crear la cuenta. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Registro con Google
   */
  const handleGoogleRegister = async () => {
    setErrorMsg("");
    setFieldErrors(EMPTY_ERRORS);
    setLoading(true);

    try {
      if (auth.currentUser) {
        setErrorMsg(
          "Ya tienes una sesión iniciada. Para crear una nueva cuenta, primero cierra sesión y vuelve a esta página."
        );
        return;
      }

      const result = await loginWithGoogle(); // UserCredential
      const info = getAdditionalUserInfo(result);
      const isNewUser = info?.isNewUser ?? false;

      console.log("[GOOGLE REGISTER] AdditionalUserInfo:", info);

      if (!isNewUser) {
        await auth.signOut();
        setErrorMsg(
          "Este correo de Google ya tiene una cuenta en ChatTeam. " +
            "No necesitas registrarte de nuevo: usa la opción 'Iniciar sesión' con Google."
        );
        return;
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("[REGISTER] Error Google:", err);
      const code = err?.code;

      if (
        code === "auth/account-exists-with-different-credential" ||
        code === "auth/email-already-in-use"
      ) {
        setErrorMsg(
          "Este correo ya tiene una cuenta en ChatTeam. " +
            "Inicia sesión con tu correo y contraseña y luego vincula Google desde tu perfil."
        );
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Google antes de terminar el registro."
        );
      } else if (code === "auth/cancelled-popup-request") {
        setErrorMsg(
          "Ya hay una ventana de autenticación abierta. Intenta de nuevo."
        );
      } else {
        setErrorMsg("No se pudo completar el registro con Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Registro con Facebook (mismo comportamiento que Google) */
  const handleFacebookRegister = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      if (auth.currentUser) {
        setErrorMsg(
          "Ya tienes una sesión iniciada. Para crear una nueva cuenta, primero cierra sesión y vuelve a esta página."
        );
        return;
      }

      const result = await loginWithFacebook(); // UserCredential
      const info = getAdditionalUserInfo(result);
      const isNewUser = info?.isNewUser ?? false;

      console.log("[FACEBOOK REGISTER] AdditionalUserInfo:", info);

      if (!isNewUser) {
        await auth.signOut();
        setErrorMsg(
          "Este correo de Facebook ya tiene una cuenta en ChatTeam. " +
            "No necesitas registrarte de nuevo: usa la opción 'Iniciar sesión' con Facebook."
        );
        return;
      }

      navigate("/profile");
    } catch (err: any) {
      console.error("[REGISTER] Error Facebook:", err);
      const code = err?.code || "error-desconocido";

      if (
        code === "auth/account-exists-with-different-credential" ||
        code === "auth/email-already-in-use"
      ) {
        setErrorMsg(
          "Este correo ya tiene una cuenta en ChatTeam. " +
            "Inicia sesión con tu correo y contraseña y luego vincula Facebook desde tu perfil."
        );
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Facebook antes de terminar el registro."
        );
      } else if (code === "auth/cancelled-popup-request") {
        setErrorMsg(
          "Ya hay una ventana de autenticación abierta. Intenta de nuevo."
        );
      } else {
        setErrorMsg("No se pudo completar el registro con Facebook.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 md:px-8 py-32 md:py-40">
      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* Columna izquierda (branding) */}
        <div className="relative flex flex-col justify-center items-center md:items-start bg-gradient-to-br from-purple-600 to-blue-600 w-full md:w-[40%] px-10 py-16 md:py-20 text-white overflow-hidden">
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
                <span className="text-2xl">-</span>
                <span>Sin límites de reuniones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-8 md:px-12 py-12 md:py-16 bg-white">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Crear cuenta
            </h2>
            <p className="text-gray-500 mb-8">
              Completa tus datos para comenzar
            </p>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Nombres */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Nombres
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  aria-invalid={!!fieldErrors.firstName}
                  aria-describedby={
                    fieldErrors.firstName ? "firstName-error" : undefined
                  }
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                    fieldErrors.firstName
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tus nombres"
                />
                {fieldErrors.firstName && (
                  <p
                    id="firstName-error"
                    className="mt-1 text-xs text-red-600"
                  >
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Apellidos
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  aria-invalid={!!fieldErrors.lastName}
                  aria-describedby={
                    fieldErrors.lastName ? "lastName-error" : undefined
                  }
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                    fieldErrors.lastName
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tus apellidos"
                />
                {fieldErrors.lastName && (
                  <p id="lastName-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

              {/* Edad */}
              <div>
                <label
                  htmlFor="age"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Edad
                </label>
                <input
                  id="age"
                  type="number"
                  min={10}
                  max={120}
                  required
                  aria-invalid={!!fieldErrors.age}
                  aria-describedby={fieldErrors.age ? "age-error" : undefined}
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                    fieldErrors.age
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 20"
                />
                {fieldErrors.age && (
                  <p id="age-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.age}
                  </p>
                )}
              </div>

              {/* Correo */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
                {fieldErrors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Contraseña con ojito */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
                    className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 pr-11 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                      fieldErrors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      // ojo abierto
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      // ojo tachado
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18M10.477 10.48A3 3 0 0115 12m-1.06 2.94A3 3 0 019 12c0-.34.057-.667.162-.973M9.88 9.88A3 3 0 0112 9c3.866 0 7 3 8 3-.41.656-1.05 1.45-1.9 2.19m-2.12 1.52C14.623 16.72 13.36 17 12 17c-3.866 0-7-3-8-3 .64-1.024 1.61-2.18 2.84-3.03"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña con ojito */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    aria-invalid={!!fieldErrors.confirmPassword}
                    aria-describedby={
                      fieldErrors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                    className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 pr-11 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${
                      fieldErrors.confirmPassword
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-blue-500"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />

                  <button
                    type="button"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                  >
                    {showConfirmPassword ? (
                      // ojo abierto
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    ) : (
                      // ojo tachado
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3l18 18M10.477 10.48A3 3 0 0115 12m-1.06 2.94A3 3 0 019 12c0-.34.057-.667.162-.973M9.88 9.88A3 3 0 0112 9c3.866 0 7 3 8 3-.41.656-1.05 1.45-1.9 2.19m-2.12 1.52C14.623 16.72 13.36 17 12 17c-3.866 0-7-3-8-3 .64-1.024 1.61-2.18 2.84-3.03"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="mt-1 text-xs text-red-600"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {errorMsg && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                  role="alert"
                  aria-live="assertive"
                >
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

            {/* Separador */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="px-4 text-gray-400 text-sm font-medium">
                o regístrate con
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Botones sociales */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleRegister}
                disabled={loading}
                className="flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-[1.02] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={loading}
                className="flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-all text-white font-medium hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
