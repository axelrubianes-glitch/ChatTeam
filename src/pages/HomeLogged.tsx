import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getMeeting } from "../lib/meetings";

function extractRoomId(input: string) {
  const v = (input || "").trim();
  const m1 = v.match(/\/meeting\/([A-Za-z0-9]{4,12})/);
  if (m1?.[1]) return m1[1].toUpperCase();
  return v.toUpperCase();
}

export default function HomeLogged() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string>("");

  function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function handleCreateMeeting() {
    const roomId = generateRoomId();
    navigate(`/meeting/${roomId}?new=1`);
  }

  async function handleJoinMeeting(e: React.FormEvent) {
    e.preventDefault();
    setJoinError("");

    const rid = extractRoomId(joinCode);
    if (!rid) return;

    setJoining(true);
    try {
      const meeting = await getMeeting(rid);

      if (!meeting || meeting.active === false) {
        setJoinError("Esa reunión no existe (o ya terminó). Verifica el ID.");
        return;
      }

      navigate(`/meeting/${rid}`);
    } catch {
      setJoinError("No pude validar la reunión en Firestore. Revisa login/reglas.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      {/* Frame / tarjeta */}
      <section className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-100 px-6 py-10 md:px-10 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            Comunicación sin <span className="text-blue-600">límites</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-500">
            Crea una reunión o únete con un código para conectar con tu equipo.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-3 items-stretch md:items-center justify-center">
          <button
            type="button"
            onClick={handleCreateMeeting}
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg text-sm md:text-base"
          >
            Crear reunión
          </button>

          <form
            onSubmit={handleJoinMeeting}
            className="flex flex-col md:flex-row gap-2 items-stretch md:items-center w-full md:w-auto"
          >
            <input
              type="text"
              placeholder="Código o link (Ej: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="px-3 py-3 rounded-xl border border-slate-300 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 bg-white"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-semibold disabled:opacity-60 text-sm md:text-base"
            >
              {joining ? "Validando..." : "Unirse"}
            </button>
          </form>
        </div>

        {joinError && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-center">
            {joinError}
          </div>
        )}
      </section>
    </main>
  );
}
