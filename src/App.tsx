import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register"
import { useEffect } from "react";
import useAuthStore from "./stores/useAuthStore";


function App() {
  const { initAuthObserver } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initAuthObserver();
    return () => unsubscribe(); // se limpia al desmontar
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
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
