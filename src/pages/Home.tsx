/**
 * @file Home.tsx
 * @description Página principal de inicio para ChatTeam. Contiene el mensaje de bienvenida, texto explicativo y botones de acción.
 * @module pages/Home
 */

import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="flex justify-center items-center min-h-screen w-full px-4 md:px-6 pt-24 pb-12 bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* ==== Contenedor interno centrado ==== */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-[1200px] gap-12 md:gap-16 animate-fade-in">
        {/* ==== Texto principal ==== */}
        <div className="flex-1 text-center md:text-left space-y-6">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
            Comunicación sin límites
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Conéctate con quien quieras,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              donde quieras
            </span>
          </h1>

          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-xl">
            Videollamadas seguras, rápidas y sin fronteras. Con{' '}
            <span className="text-blue-600 font-bold">ChatTeam</span> puedes
            crear reuniones o unirte en cuestión de segundos.
          </p>

          {/* ==== Características destacadas ==== */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>HD de alta calidad</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Cifrado end-to-end</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Gratis para todos</span>
            </div>
          </div>

          {/* ==== Botones de acción ==== */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
            <Link
              to="/register"
              className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              Comenzar ahora
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>

            <Link
              to="/about"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105"
            >
              Saber más
            </Link>
          </div>
        </div>

        {/* ==== Imagen ilustrativa mejorada ==== */}
        <div className="flex justify-center flex-1">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-2xl animate-pulse"></div>
            <img
              src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
              alt="Ilustración de videollamada"
              className="relative w-80 md:w-96 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
