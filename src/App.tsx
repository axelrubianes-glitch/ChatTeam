import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import RecoverPassword from "./pages/RecoverPassword";

import useAuthStore from "./stores/useAuthStore";

function App() {
  const { initAuthObserver } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuthObserver();
    return () => unsubscribe();
  }, [initAuthObserver]);

  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Perfil (vinculación Google/Facebook ya la tienes hecha) */}
          <Route path="/profile" element={<Profile />} />

          {/* Recuperar contraseña (solo diseño, sin backend todavía) */}
          <Route path="/recover-password" element={<RecoverPassword />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
