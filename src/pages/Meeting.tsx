// src/pages/Meeting.tsx
/**
 * @file Meeting.tsx
 * @description Meeting room with ID + realtime chat via Socket.IO
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  TbMicrophone,
  TbCamera,
  TbMessageCircle,
  TbPhoneOff,
} from "react-icons/tb";
import useAuthStore from "../stores/useAuthStore";
import { getChatSocket, type JoinAck } from "../lib/chatSocket";

type Msg = {
  id: string;
  roomId: string;
  uid: string;
  name: string;
  text: string;
  ts: number;
};

export default function Meeting() {
  const params = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ID tal como viene en la URL
  const rawRoomId = params.roomId ?? "";
  // Normalizado a MAYÚSCULAS y sin espacios
  const roomId = useMemo(
    () => rawRoomId.trim().toUpperCase(),
    [rawRoomId]
  );

  // 👇 Este flag indica si ESTE usuario tiene permiso para CREAR la sala
  // Acepta tanto ?new=1 como ?host=1 (por compatibilidad)
  const canCreate =
    searchParams.get("new") === "1" || searchParams.get("host") === "1";

  const [status, setStatus] = useState<"connecting" | "ok" | "error">(
    "connecting"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState("");

  // Evitar que hagamos join dos veces por culpa del modo estricto de React
  const joinedRef = useRef(false);

  const me = useMemo(
    () => ({
      uid: user?.uid || "anon",
      name: user?.displayName || user?.email || "Guest",
    }),
    [user]
  );

  // Link limpio (sin ?new=1 / ?host=1) para copiar
  const cleanUrl = useMemo(
    () => `${window.location.origin}/meeting/${roomId}`,
    [roomId]
  );

  useEffect(() => {
    // Si no hay roomId → mandamos al inicio
    if (!roomId) {
      navigate("/", { replace: true });
      return;
    }

    // Si viene en minúsculas, normalizamos la URL a mayúsculas
    if (rawRoomId && rawRoomId !== roomId) {
      navigate(`/meeting/${roomId}${window.location.search}`, {
        replace: true,
      });
      return;
    }

    const socket = getChatSocket();

    const handleMessage = (payload: Msg) => {
      if (payload.roomId !== roomId) return;
      setMessages((prev) => [...prev, payload]);
    };

    const handleConnect = () => {
      if (joinedRef.current) return; // ya hicimos join
      joinedRef.current = true;

      setStatus("connecting");
      setErrorMsg("");

      socket.emit(
        "room:join",
        { roomId, create: canCreate, user: me },
        (ack: JoinAck) => {
          if (!ack.ok) {
            setStatus("error");

            if (ack.error === "ROOM_NOT_FOUND") {
              setErrorMsg(
                "Esa reunión no existe o ya terminó. Verifica el ID."
              );
            } else if (
              typeof ack.error === "string" &&
              (ack.error.includes("full") || ack.error.includes("Room is full"))
            ) {
              setErrorMsg("La sala está llena (máximo 10 usuarios).");
            } else {
              setErrorMsg(
                "No se pudo unir/crear la reunión. Revisa chat-server."
              );
            }
            return;
          }

          setStatus("ok");

          // Si veníamos como creador (?new=1 / ?host=1),
          // limpiamos el query para que el link quede bonito
          if (canCreate) {
            navigate(`/meeting/${roomId}`, { replace: true });
          }
        }
      );
    };

    const handleDisconnect = () => {
      setStatus("connecting");
      joinedRef.current = false;
    };

    socket.on("chat:message", handleMessage);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Si ya está conectado el socket, hacemos join inmediato
    if (socket.connected) handleConnect();

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      joinedRef.current = false;
    };
  }, [roomId, rawRoomId, canCreate, me, navigate]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "ok") return;

    const text = pending.trim();
    if (!text) return;

    getChatSocket().emit("chat:send", { roomId, text, user: me });
    setPending("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      alert("Link copiado ✅");
    } catch {
      alert("No se pudo copiar el link.");
    }
  };

  const leave = () => navigate("/", { replace: true });

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-10 flex gap-6">
        {/* COLUMNA IZQUIERDA: “video” */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Reunión</h1>
              <span
                className={`text-xs px-3 py-1 rounded-full ${
                  status === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {status === "ok"
                  ? "Conectado"
                  : status === "error"
                  ? "Error"
                  : "Conectando..."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="font-medium text-slate-500">ID:</span>
                <span className="font-semibold tracking-widest">{roomId}</span>
              </div>

              <button
                type="button"
                onClick={copyLink}
                disabled={status !== "ok"}
                className="text-sm px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium disabled:opacity-50"
              >
                Copiar link
              </button>
            </div>
          </div>

          {status === "error" && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {errorMsg || "No se pudo conectar."}{" "}
              <button onClick={leave} className="underline font-semibold">
                Volver al inicio
              </button>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full aspect-video max-h-[70vh] bg-[#1F2940] rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-black/30 text-white">
                Tú: {me.name}
              </div>
              <div className="absolute bottom-3 left-4 text-sm text-slate-100">
                {me.name}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="bg-white border border-slate-200 shadow-lg rounded-2xl px-8 py-3 flex items-center gap-6">
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <TbMicrophone className="w-6 h-6 text-slate-700" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <TbCamera className="w-6 h-6 text-slate-700" />
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <TbMessageCircle className="w-6 h-6 text-slate-700" />
              </button>
              <button
                onClick={leave}
                className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-red-700"
              >
                <TbPhoneOff className="w-5 h-5" />
                Finalizar
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CHAT */}
        <aside className="hidden lg:flex w-[340px] bg-white border border-slate-200 rounded-2xl flex-col">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Chat</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400">Aún no hay mensajes.</p>
            ) : (
              messages.map((m) => {
                const self = m.uid === me.uid;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      self
                        ? "ml-auto bg-blue-600 text-white"
                        : "mr-auto bg-slate-100 text-slate-900"
                    }`}
                  >
                    {!self && (
                      <div className="text-[11px] font-semibold mb-0.5 opacity-80">
                        {m.name}
                      </div>
                    )}
                    <div>{m.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <form
            onSubmit={send}
            className="px-4 py-3 border-t border-slate-100 flex gap-2"
          >
            <input
              type="text"
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={status !== "ok"}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={status !== "ok"}
            >
              Enviar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
