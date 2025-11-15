/**
 * @file Home.tsx
 * @description Página principal de inicio para ChatTeam. Contiene el mensaje de bienvenida, texto explicativo y botones de acción.
 * @module pages/Home
 */

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="flex justify-center items-center min-h-[80vh] px-4 md:px-6 bg-gray-50">
      {/* ==== Contenedor interno centrado ==== */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-[1100px] gap-8 md:gap-12">
        {/* ==== Texto principal ==== */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
            Conéctate con quien quieras, donde quieras.
          </h1>

          <p className="text-gray-600 mb-8 text-lg">
            Videollamadas seguras, rápidas y sin fronteras.  
            Con <span className="text-blue-600 font-semibold">ChatTeam</span> puedes crear reuniones o unirte en cuestión de segundos.
          </p>

          {/* ==== Botones de acción ==== */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700 transition-all shadow-md"
            >
              Comenzar
            </Link>

            <Link
              to="/about"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-lg hover:bg-blue-50 transition-all"
            >
              Saber más
            </Link>
          </div>
        </div>

        {/* ==== Imagen ilustrativa ==== */}
        <div className="flex justify-center flex-1">
          <img
            src="https://cdn-icons-png.flaticon.com/512/747/747376.png"
            alt="Ilustración de videollamada"
            className="w-72 md:w-80 object-contain"
          />
        </div>
      </div>
    </section>
  );
}
