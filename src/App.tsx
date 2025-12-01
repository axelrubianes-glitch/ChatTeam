// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import RecoverPassword from "./pages/RecoverPassword";
import HomeLogged from "./pages/HomeLogged";
import Meeting from "./pages/Meeting";

import useAuthStore from "./stores/useAuthStore";

export default function App() {
  const { initAuthObserver, user, loading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuthObserver();
    return () => unsubscribe();
  }, [initAuthObserver]);

  if (loading) {
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
          <Route path="/" element={user ? <HomeLogged /> : <Home />} />
          <Route path="/about" element={<About />} />

          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />

          <Route path="/recover-password" element={<RecoverPassword />} />

          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/login" replace />}
          />

          {/* ✅ Meeting: con o sin roomId */}
          <Route
            path="/meeting"
            element={user ? <Meeting /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/meeting/:roomId"
            element={user ? <Meeting /> : <Navigate to="/login" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
