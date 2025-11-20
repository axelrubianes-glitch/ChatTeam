import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import HomeLogged from "./pages/HomeLogged"; // 👈 nueva página importada
import { useEffect } from "react";
import useAuthStore from "./stores/useAuthStore";

function App() {
  const { initAuthObserver, user, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuthObserver();
    return () => unsubscribe();
  }, [initAuthObserver]);

  if (loading) {
    // Mientras Firebase verifica la sesión, muestra un spinner
    return (
      <div className="flex items-center justify-center min-h-screen text-blue-600 font-semibold text-lg">
        Cargando...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          {/* 👇 Si el usuario está autenticado, va a HomeLogged; si no, al Home público */}
          <Route
            path="/"
            element={user ? <HomeLogged /> : <Home />}
          />

          <Route path="/about" element={<About />} />

          {/* 👇 Protegemos login/register: si ya hay sesión, redirige al home autenticado */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />

          {/* 👇 Perfil solo si está autenticado */}
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" replace />}
          />

          {/* 👇 Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
