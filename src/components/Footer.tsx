/**
 * @file Footer.tsx
 * @description Pie de página con mapa del sitio funcional y estilo acorde al Figma.
 */
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
      <div className="container mx-auto flex flex-col md:flex-row justify-around text-center md:text-left text-sm text-gray-700">
        {/* Columna 1 */}
        <div>
          <h4 className="font-semibold text-blue-700 mb-2 uppercase text-xs">
            Mapa del sitio
          </h4>
          <ul className="space-y-1">
            <li>
              <Link to="/" className="hover:text-blue-600 transition">Inicio</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-blue-600 transition">Sobre nosotros</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-blue-600 transition">Mi perfil</Link>
            </li>
            <li>
              <Link to="/meeting" className="hover:text-blue-600 transition">Crear reunión</Link>
            </li>
          </ul>
        </div>

        {/* Columna 2 */}
        <div>
          <h4 className="font-semibold text-blue-700 mb-2 uppercase text-xs">
            Menú
          </h4>
          <ul className="space-y-1">
            <li>
              <Link to="/register" className="hover:text-blue-600 transition">Registrarse</Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-blue-600 transition">Iniciar sesión</Link>
            </li>
            <li>
              <Link to="/meeting" className="hover:text-blue-600 transition">Crear reunión</Link>
            </li>
          </ul>
        </div>

        {/* Logo */}
        <div className="flex flex-col justify-center items-center mt-6 md:mt-0">
          <img src="/logo.png" alt="ChatTeam" className="w-8 h-8 mb-2" />
          <p className="font-semibold text-blue-700">ChatTeam</p>
        </div>
      </div>
    </footer>
  );
}
