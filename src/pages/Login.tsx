import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

export default function Login() {
  const { loginWithGoogle, loginWithFacebook } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      console.log('Iniciando sesión con:', email, password);
      navigate('/');
    } catch {
      setErrorMsg('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      setErrorMsg('Error al iniciar sesión con Google.');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await loginWithFacebook();
      navigate('/');
    } catch {
      setErrorMsg('Error al iniciar sesión con Facebook.');
    }
  };

  return (
    <section className="flex justify-center items-center min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 md:px-8 py-32 md:py-40">
      {/* 🔹 Contenedor principal con animación y mejor espaciado */}
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* 🔹 Columna izquierda (branding) */}
        <div className="relative flex flex-col justify-center items-center md:items-start bg-gradient-to-br from-blue-600 to-purple-600 w-full md:w-[40%] px-10 py-16 md:py-20 text-white overflow-hidden">
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

        {/* 🔹 Columna derecha (formulario) */}
        <div className="flex flex-col justify-center items-center w-full md:w-[60%] px-8 md:px-12 py-12 md:py-16 bg-white">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Iniciar sesión
            </h2>
            <p className="text-gray-500 mb-8">
              Ingresa tus credenciales para continuar
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
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
                  onChange={e => setEmail(e.target.value)}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-blue-600" />
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
                  'Iniciar sesión'
                )}
              </button>
            </form>

            {/* Separador mejorado */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">
                o continúa con
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {/* Botones sociales mejorados */}
            <div className="flex flex-col gap-3">
              <button
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
              ¿No tienes cuenta?{' '}
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