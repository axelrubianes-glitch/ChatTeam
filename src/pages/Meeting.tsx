import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TbMicrophone, TbCamera, TbMessageCircle, TbPhoneOff } from "react-icons/tb";
import useAuthStore from "../stores/useAuthStore";
import { getChatSocket, type JoinAck } from "../lib/chatSocket";
import {
  createMeetingDoc,
  getMeeting,
  joinMeetingFirestore,
  leaveMeetingFirestore,
  listenParticipants,
  type Participant,
} from "../lib/meetings";

type Msg = { id: string; roomId: string; uid: string; name: string; text: string; ts: number };

export default function Meeting() {
  const { roomId: raw } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const isCreate = searchParams.get("new") === "1" || searchParams.get("host") === "1";

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const roomId = useMemo(() => (raw || "").trim().toUpperCase(), [raw]);

  const me = useMemo<Participant>(() => {
    return {
      uid: user?.uid || "",
      name: user?.displayName || user?.email || "Guest",
    };
  }, [user]);

  // Estado reunión (Firestore)
  const [status, setStatus] = useState<"connecting" | "ok" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");

  // Estado chat (Socket)
  const [chatStatus, setChatStatus] = useState<"connecting" | "ok" | "error">("connecting");
  const [chatErrorMsg, setChatErrorMsg] = useState("");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fsReady, setFsReady] = useState(false);

  // Tokens para hacer effects “StrictMode-safe”
  const fsTokenRef = useRef(0);
  const socketTokenRef = useRef(0);

  const leaveCalledRef = useRef(false);

  // Guardar “si era create” SOLO al entrar por primera vez a esa room
  const initialRoomRef = useRef("");
  const initialCreateRef = useRef(false);

  const leave = () => navigate("/", { replace: true });

  // normaliza URL a mayúscula
  useEffect(() => {
    if (!roomId) {
      leave();
      return;
    }
    if (raw && raw !== roomId) {
      navigate(`/meeting/${roomId}${window.location.search}`, { replace: true });
    }
  }, [roomId, raw, navigate]);

  // cuando cambia de room, resetea estados
  useEffect(() => {
    if (!roomId) return;

    if (initialRoomRef.current !== roomId) {
      initialRoomRef.current = roomId;
      initialCreateRef.current = isCreate;

      setStatus("connecting");
      setErrorMsg("");
      setFsReady(false);

      setChatStatus("connecting");
      setChatErrorMsg("");

      setMessages([]);
      setParticipants([]);
      setPending("");

      leaveCalledRef.current = false;
    }
  }, [roomId, isCreate]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      alert("ID copiado ✅");
    } catch {
      alert("No se pudo copiar el ID.");
    }
  };

  // 1) Firestore: crear/validar + join + listener participants
  useEffect(() => {
    if (!roomId || !me.uid) return;

    const myToken = ++fsTokenRef.current; // invalida intentos previos
    setStatus("connecting");
    setErrorMsg("");

    let unsub: (() => void) | null = null;

    (async () => {
      try {
        // create/validación
        if (initialCreateRef.current) {
          const existing = await getMeeting(roomId);
          if (!existing) await createMeetingDoc(roomId, me);
        } else {
          const meeting = await getMeeting(roomId);
          if (!meeting || meeting.active === false) {
            if (fsTokenRef.current !== myToken) return;
            setStatus("error");
            setErrorMsg("Esa reunión no existe o ya terminó. Verifica el ID.");
            return;
          }
        }

        // join
        await joinMeetingFirestore(roomId, me);

        // listener
        unsub = listenParticipants(roomId, (p) => {
          if (fsTokenRef.current !== myToken) return;
          setParticipants(p);
        });

        if (fsTokenRef.current !== myToken) return;
        setFsReady(true);
        setStatus("ok");
      } catch (err) {
        console.error("🔥 Firestore error:", err);
        if (fsTokenRef.current !== myToken) return;

        setStatus("error");
        setErrorMsg("No pude entrar a la reunión (Firestore). Revisa reglas/login.");
      }
    })();

    // solo antes de cerrar pestaña
    const onUnload = () => {
      if (leaveCalledRef.current) return;
      leaveCalledRef.current = true;
      leaveMeetingFirestore(roomId, me).catch(() => {});
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      unsub?.();
    };
  }, [roomId, me.uid, me.name]);

  // 2) Socket: join chat + mensajes (NO bloquea la reunión)
  useEffect(() => {
    if (!roomId || !me.uid) return;
    if (!fsReady) return;

    const myToken = ++socketTokenRef.current;

    setChatStatus("connecting");
    setChatErrorMsg("");

    const socket = getChatSocket();
    socket.connect(); // fuerza conexión si quedó dormido

    const onMsg = (payload: Msg) => {
      if (socketTokenRef.current !== myToken) return;
      if (payload.roomId !== roomId) return;
      setMessages((prev) => [...prev, payload]);
    };

    const tryJoin = () => {
      if (socketTokenRef.current !== myToken) return;

      const createFlag = initialCreateRef.current;

      socket.emit(
        "room:join",
        { roomId, user: { uid: me.uid, name: me.name }, create: createFlag },
        (ack: JoinAck) => {
          if (socketTokenRef.current !== myToken) return;

          if (!ack.ok) {
            // Si el host aún no conectó, reintenta
            if (ack.error === "ROOM_NOT_FOUND") {
              setChatStatus("connecting");
              setChatErrorMsg("Esperando al host para activar el chat...");
              window.setTimeout(() => {
                if (socketTokenRef.current === myToken) tryJoin();
              }, 1200);
              return;
            }

            setChatStatus("error");
            setChatErrorMsg(
              ack.error === "ROOM_FULL"
                ? "La sala está llena (máximo 10 usuarios)."
                : "No se pudo unir al chat."
            );
            return;
          }

          setChatStatus("ok");
          setChatErrorMsg("");

          if (createFlag) {
            navigate(`/meeting/${roomId}`, { replace: true });
          }
        }
      );
    };

    const onConnect = () => {
      if (socketTokenRef.current !== myToken) return;
      tryJoin();
    };

    const onConnectError = (e: any) => {
      console.error("🔥 socket connect_error:", e);
      if (socketTokenRef.current !== myToken) return;

      setChatStatus("error");
      setChatErrorMsg("No se pudo conectar con chat-server. Revisa VITE_CHAT_BASE y que el server esté corriendo.");
    };

    socket.on("chat:message", onMsg);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);

    // si ya estaba conectado, intenta join
    if (socket.connected) tryJoin();

    return () => {
      socket.off("chat:message", onMsg);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      // NO hacemos leave aquí para no romper por StrictMode en DEV
    };
  }, [roomId, me.uid, me.name, fsReady, navigate]);

  const handleLeave = async () => {
    if (leaveCalledRef.current) {
      leave();
      return;
    }
    leaveCalledRef.current = true;

    try {
      getChatSocket().emit("room:leave", { roomId, uid: me.uid });
      await leaveMeetingFirestore(roomId, me);
    } catch {
      // igual salimos
    } finally {
      leave();
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatStatus !== "ok") return;

    const text = pending.trim();
    if (!text) return;

    getChatSocket().emit("chat:send", { roomId, text, user: { uid: me.uid, name: me.name } });
    setPending("");
  };

  const others = participants.filter((p) => p.uid !== me.uid);

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-10 flex gap-6">
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
                {status === "ok" ? "En sala" : status === "error" ? "Error" : "Entrando..."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="font-medium text-slate-500">ID:</span>
                <span className="font-semibold tracking-widest">{roomId}</span>
              </div>

              <button
                type="button"
                onClick={copyId}
                className="text-sm px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
              >
                Copiar ID
              </button>
            </div>
          </div>

          {status === "error" && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {errorMsg || "No se pudo entrar."}{" "}
              <button onClick={leave} className="underline font-semibold">
                Volver al inicio
              </button>
            </div>
          )}

          {/* Tiles */}
          <div className="flex-1">
            <div className={`grid gap-4 ${others.length === 0 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              <div className="aspect-video max-h-[70vh] bg-[#1F2940] rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-black/30 text-white">
                  Tú: {me.name}
                </div>
                <div className="absolute bottom-3 left-4 text-sm text-slate-100">{me.name}</div>
              </div>

              {others.map((u) => (
                <div key={u.uid} className="aspect-video max-h-[70vh] bg-[#25324D] rounded-2xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-black/30 text-white">
                    Participante
                  </div>
                  <div className="absolute bottom-3 left-4 text-sm text-slate-100">{u.name}</div>
                </div>
              ))}
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
                onClick={handleLeave}
                className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-red-700"
              >
                <TbPhoneOff className="w-5 h-5" />
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Chat */}
        <aside className="hidden lg:flex w-[340px] bg-white border border-slate-200 rounded-2xl flex-col">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Chat</h2>
            <span
              className={`text-[11px] px-2 py-1 rounded-full ${
                chatStatus === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : chatStatus === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {chatStatus === "ok" ? "Conectado" : chatStatus === "error" ? "Sin chat" : "Conectando..."}
            </span>
          </div>

          {chatErrorMsg && (
            <div className="mx-4 mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
              {chatErrorMsg}
            </div>
          )}

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
                      self ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-slate-100 text-slate-900"
                    }`}
                  >
                    {!self && <div className="text-[11px] font-semibold mb-0.5 opacity-80">{m.name}</div>}
                    <div>{m.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="px-4 py-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={pending}
              onChange={(e) => setPending(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={chatStatus !== "ok"}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              disabled={chatStatus !== "ok"}
            >
              Enviar
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
