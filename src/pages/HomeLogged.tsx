/**
 * @file HomeLogged.tsx
 * @description Página de inicio para usuarios con sesión activa.
 */

import { Link } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

export default function HomeLogged() {
  const { user } = useAuthStore();

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 px-6 py-24 md:py-32 animate-fade-in">
      {/* ==== Contenedor principal ==== */}
      <div className="bg-white/60 backdrop-blur-md shadow-xl rounded-3xl px-10 py-16 md:px-20 md:py-20 text-center max-w-4xl w-full border border-gray-100">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Comunicación sin <span className="text-blue-600">límites</span>
        </h2>

        <p className="text-gray-600 text-lg md:text-xl mb-10">
          Reúnete y trabaja con tu equipo estés donde estés gracias a{" "}
          <span className="font-semibold text-blue-600">ChatTeam</span>.
        </p>

        {/* ==== Botones principales ==== */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Link
            to="/meeting"
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all"
          >
            Crear reunión
          </Link>

          <Link
            to="/join"
            className="bg-gray-100 border-2 border-gray-200 text-gray-800 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-200 hover:border-gray-300 transition-all"
          >
            Unirse
          </Link>
        </div>

        {/* ==== Indicadores / beneficios ==== */}
        <div className="flex flex-wrap justify-center gap-6 text-gray-500 text-sm">
          <span>✔️ Reuniones ilimitadas</span>
          <span>✔️ Encriptadas end-to-end</span>
          <span>✔️ Calidad HD</span>
          <span>✔️ Gratis para todos los usuarios</span>
        </div>
      </div>      
    </section>
  );
}
