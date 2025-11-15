import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function Login() {
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      console.log("Iniciando sesión con:", email, password);
      navigate("/");
    } catch {
      setErrorMsg("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/");
    } catch {
      setErrorMsg("Error al iniciar sesión con Google.");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      navigate("/");
    } catch {
      setErrorMsg("Error al iniciar sesión con Facebook.");
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen bg-gray-100 px-4 md:px-8 py-8">
      {/* 🔹 Contenedor totalmente centrado */}
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden justify-center items-stretch">
        {/* 🔹 Columna izquierda (logo + texto) */}
        <div className="flex flex-col justify-center items-center md:items-start bg-gray-50 w-full md:w-[40%] px-8 md:px-10 py-12 md:py-14">
          <img
            src="/logo.png"
            alt="ChatTeam"
            className="w-40 md:w-44 h-40 md:h-44 object-contain mb-6"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-3 text-center md:text-left">
            Bienvenido a ChatTeam
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed text-center md:text-left max-w-xs">
            Reúnete fácilmente desde cualquier lugar y con cualquier persona.  
            Inicia sesión para continuar con tus reuniones o crear nuevas.
          </p>
        </div>

        {/* 🔹 Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-6 md:px-8 py-12">
          <div className="w-full max-w-[380px]">
            <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
              Iniciar sesión
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {errorMsg && (
                <p className="text-red-500 text-sm text-center">{errorMsg}</p>
              )}

              <div className="text-right">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-medium shadow-md"
              >
                {loading ? "Iniciando..." : "Iniciar sesión"}
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-2 text-gray-500 text-sm">o continúa con</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Botones sociales */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-all"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5"
                />
                <span className="text-gray-700 font-medium">
                  Continuar con Google
                </span>
              </button>

              <button
                onClick={handleFacebookLogin}
                className="flex items-center justify-center gap-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-all text-white font-medium"
              >
                <img
                  src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                  alt="Facebook"
                  className="w-5 h-5"
                />
                <span>Continuar con Facebook</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              ¿No tienes cuenta?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
