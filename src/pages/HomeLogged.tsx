// src/pages/HomeLogged.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CHAT_BASE = import.meta.env.VITE_CHAT_BASE ?? "http://localhost:4001";

export default function HomeLogged() {
  const navigate = useNavigate();

  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string>("");

  // Genera un ID tipo ABC123
  function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 👉 CREAR REUNIÓN (NO valida nada, solo navega como host)
  function handleCreateMeeting() {
    const roomId = generateRoomId();
    // Marcamos que este usuario es el creador con ?new=1
    navigate(`/meeting/${roomId}?new=1`);
  }

  // 👉 UNIRSE A REUNIÓN EXISTENTE (sí valida contra chat-server)
  async function handleJoinMeeting(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");

    // Normalizamos a mayúsculas
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) return;

    setJoining(true);
    try {
      const res = await fetch(
        `${CHAT_BASE}/rooms/${encodeURIComponent(trimmed)}/exists`
      );
      if (!res.ok) throw new Error("Rooms API not available");

      const data: { ok: boolean; roomId: string; exists: boolean } =
        await res.json();

      if (!data.exists) {
        setJoinError("Esa reunión no existe (o ya terminó). Verifica el ID.");
        return; // ❌ NO navegamos
      }

      // ✅ Sala encontrada → navegamos sin query extra
      navigate(`/meeting/${trimmed}`);
    } catch {
      setJoinError(
        "No pude validar la reunión. Revisa que chat-server esté corriendo."
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <section className="max-w-5xl mx-auto px-4 pt-32 pb-20 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Comunicación sin <span className="text-blue-600">límites</span>
        </h1>

        {/* BOTONES PRINCIPALES */}
        <div className="flex flex-col sm:flex-row gap-4 mb-3">
          <button
            type="button"
            onClick={handleCreateMeeting}
            className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md"
          >
            Crear reunión
          </button>

          <form
            onSubmit={handleJoinMeeting}
            className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
          >
            <input
              type="text"
              placeholder="Código de reunión (ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="px-3 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-60 bg-white"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold disabled:opacity-60"
            >
              {joining ? "Validando..." : "Unirse"}
            </button>
          </form>
        </div>

        {/* Mensaje de error al UNIRSE */}
        {joinError && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
            {joinError}
          </div>
        )}

        {/* Ventajas / bullets */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-slate-600">
          <span>✔ Reuniones ilimitadas</span>
          <span>✔ Encriptadas end-to-end</span>
          <span>✔ Calidad HD</span>
          <span>✔ Gratis para todos los usuarios</span>
        </div>
      </section>
    </main>
  );
}
