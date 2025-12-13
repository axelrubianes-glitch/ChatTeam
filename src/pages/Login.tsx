// src/pages/Login.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase.config";
import useAuthStore from "../stores/useAuthStore";

type FieldErrors = {
  email: string;
  password: string;
};

const EMPTY_ERRORS: FieldErrors = {
  email: "",
  password: "",
};

export default function Login() {
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(EMPTY_ERRORS);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // =============================
  //  CARGAR "RECORDARME"
  // =============================
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem("ct_remember_me") === "true";
      if (savedRemember) {
        const savedEmail = localStorage.getItem("ct_login_email") || "";
        const savedPassword = localStorage.getItem("ct_login_password") || "";
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch {
      // ignorar errores de localStorage
    }
  }, []);

  const persistRememberData = (
    currEmail: string,
    currPassword: string,
    remember: boolean
  ) => {
    try {
      if (remember) {
        localStorage.setItem("ct_remember_me", "true");
        localStorage.setItem("ct_login_email", currEmail.trim());
        localStorage.setItem("ct_login_password", currPassword);
      } else {
        localStorage.removeItem("ct_remember_me");
        localStorage.removeItem("ct_login_email");
        localStorage.removeItem("ct_login_password");
      }
    } catch {
      // ignorar errores
    }
  };

  // =============================
  //  LOGIN CORREO / CONTRASEÑA
  // =============================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setFieldErrors(EMPTY_ERRORS);

    let hasError = false;
    const newErrors: FieldErrors = { ...EMPTY_ERRORS };

    // Validaciones simples
    if (!email.trim()) {
      newErrors.email = "Por favor ingresa tu correo electrónico.";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Por favor ingresa tu contraseña.";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim();

      await signInWithEmailAndPassword(auth, trimmedEmail, password);

      // Guardar o limpiar "Recordarme"
      persistRememberData(trimmedEmail, password, rememberMe);

      navigate("/");
    } catch (err: any) {
      console.error("[LOGIN] Error con correo/contraseña:", err);
      const code = err?.code || "error-desconocido";

      if (
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential" ||
        code === "auth/invalid-login-credentials"
      ) {
        // Solo mostrar que la contraseña está mal
        setFieldErrors((prev) => ({
          ...prev,
          password: "Contraseña incorrecta.",
        }));
        setErrorMsg("La contraseña es incorrecta. Intenta de nuevo.");
      } else if (code === "auth/invalid-email") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "El formato de correo no es válido.",
        }));
        setErrorMsg("El correo electrónico no es válido.");
      } else {
        // Mensaje genérico SIN decir "no existe cuenta" ni "demasiados intentos"
        setErrorMsg("No pudimos iniciar sesión. Revisa tus datos e inténtalo nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =============================
  //  LOGIN GOOGLE
  // =============================
  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setFieldErrors(EMPTY_ERRORS);

    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err: any) {
      console.error("[LOGIN] Error Google:", err);
      const code = err?.code || "error-desconocido";

      if (
        code === "auth/account-exists-with-different-credential" ||
        code === "auth/email-already-in-use"
      ) {
        setErrorMsg(
          "Ya tienes una cuenta asociada a este correo usando otro método. Inicia sesión con ese método."
        );
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Google antes de terminar el proceso."
        );
      } else {
        setErrorMsg("No se pudo iniciar sesión con Google. Intenta de nuevo.");
      }
    }
  };

  // =============================
  //  LOGIN FACEBOOK
  // =============================
  const handleFacebookLogin = async () => {
    setErrorMsg("");
    setFieldErrors(EMPTY_ERRORS);

    try {
      await loginWithFacebook();
      navigate("/");
    } catch (err: any) {
      console.error("[LOGIN] Error Facebook:", err);
      const code = err?.code || "error-desconocido";

      if (
        code === "auth/account-exists-with-different-credential" ||
        code === "auth/email-already-in-use"
      ) {
        setErrorMsg(
          "Este correo ya tiene una cuenta con otro método. Inicia sesión con ese método."
        );
      } else if (code === "auth/popup-closed-by-user") {
        setErrorMsg(
          "Cerraste la ventana de Facebook antes de terminar el proceso."
        );
      } else {
        setErrorMsg(
          "No se pudo iniciar sesión con Facebook. Intenta nuevamente."
        );
      }
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

            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              Bienvenido de nuevo
            </h1>

            <p className="text-blue-100 text-base leading-relaxed max-w-xs">
              Accede a tu cuenta y continúa conectando con tu equipo desde
              cualquier lugar del mundo.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Conexión 100% segura</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Acceso instantáneo</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">-</span>
                <span>Disponible en todo el mundo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-8 md:px-12 py-12 md:py-16 bg-white">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-500 mb-8">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? "login-email-error" : undefined
                  }
                  className={`w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white transition-all ${fieldErrors.email
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-blue-500"
                    }`}
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors.email && (
                  <p
                    id="login-email-error"
                    className="mt-1 text-xs text-red-600"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password + ojito */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-gray-700 font-semibold mb-2 text-sm"
                >
                  Contraseña
                </label>
                <div
                  className={`flex items-center bg-gray-50 border-2 rounded-xl px-3 py-1 focus-within:bg-white transition-all ${fieldErrors.password
                      ? "border-red-400 focus-within:border-red-500"
                      : "border-gray-200 focus-within:border-blue-500"
                    }`}
                >
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                      fieldErrors.password ? "login-password-error" : undefined
                    }
                    className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 py-2.5 pr-2 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 014.06-5.94M9.88 9.88A3 3 0 0114.12 14.12M6.1 6.1L3 3m18 18l-3.1-3.1" />
                      </svg>
                    )}
                  </button>

                </div>
                {fieldErrors.password && (
                  <p
                    id="login-password-error"
                    className="mt-1 text-xs text-red-600"
                  >
                    {fieldErrors.password}
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Recordarme</span>
                </label>
                <Link
                  to="/recover-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
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
                    Iniciando...
                  </span>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="px-4 text-gray-400 text-sm font-medium">
                o continúa con
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Botones sociales */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 border-2 border-gray-200 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-[1.02] font-medium"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-gray-700">Continuar con Google</span>
              </button>

              <button
                type="button"
                onClick={handleFacebookLogin}
                className="flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-all text-white font-medium hover:scale-[1.02] shadow-md"
              >
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  className="w-5 h-5"
                />
                <span>Continuar con Facebook</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
