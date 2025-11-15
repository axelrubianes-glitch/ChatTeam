/**
 * @file Navbar.tsx
 * @description Responsive navbar with user authentication detection.
 */

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

/**
 * Navbar component for ChatTeam.
 * Shows different buttons depending on user authentication state.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuthStore();

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ===== Logo ===== */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="text-primary text-2xl font-bold hover:opacity-90 transition-opacity"
            >
              💬 ChatTeam
            </Link>
          </div>

          {/* ===== Menú principal (desktop) ===== */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-primary ${
                  isActive ? "text-primary font-semibold" : "text-gray-700"
                }`
              }
            >
              Inicio
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `hover:text-primary ${
                  isActive ? "text-primary font-semibold" : "text-gray-700"
                }`
              }
            >
              Sobre nosotros
            </NavLink>

            <NavLink
              to="/meeting"
              className={({ isActive }) =>
                `hover:text-primary ${
                  isActive ? "text-primary font-semibold" : "text-gray-700"
                }`
              }
            >
              Mapa del sitio
            </NavLink>

            {/* ===== Acciones según autenticación ===== */}
            {!loading && (
              <div className="flex items-center gap-3">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="border border-primary text-primary px-4 py-1.5 rounded-md hover:bg-blue-50 transition-all"
                    >
                      Registrarse
                    </Link>
                    <Link
                      to="/login"
                      className="bg-primary text-white px-4 py-1.5 rounded-md hover:bg-blue-600 transition-all"
                    >
                      Iniciar sesión
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      className="border border-primary text-primary px-4 py-1.5 rounded-md hover:bg-blue-50 transition-all"
                    >
                      Perfil
                    </Link>
                    <button
                      onClick={logout}
                      className="bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition-all"
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ===== Botón menú móvil ===== */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== Menú móvil ===== */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <NavLink
              to="/"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Inicio
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Sobre nosotros
            </NavLink>
            <NavLink
              to="/meeting"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-primary"
            >
              Mapa del sitio
            </NavLink>

            {!loading && (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      onClick={() => setIsOpen(false)}
                      className="border border-primary text-primary px-4 py-2 rounded-md hover:bg-blue-50 text-center"
                    >
                      Registrarse
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 text-center"
                    >
                      Iniciar sesión
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="border border-primary text-primary px-4 py-2 rounded-md hover:bg-blue-50 text-center"
                    >
                      Perfil
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-center"
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
