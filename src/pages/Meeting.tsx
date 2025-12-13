// src/pages/Meeting.tsx
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  TbMicrophone,
  TbCamera,
  TbMessageCircle,
  TbPhoneOff,
  TbX,
  TbMicrophoneOff,
} from "react-icons/tb";
import Peer, { type MediaConnection } from "peerjs";

import useAuthStore from "../stores/useAuthStore";
import { getChatSocket, type JoinAck } from "../lib/chatSocket";
import {
  getVoiceSocket,
  type VoicePeer,
  type VoiceJoinAck,
} from "../lib/voiceSocket";
import {
  createMeetingDoc,
  getMeeting,
  joinMeetingFirestore,
  leaveMeetingFirestore,
  listenParticipants,
  type Participant,
} from "../lib/meetings";

type Msg = {
  id: string;
  roomId: string;
  uid: string;
  name: string;
  text: string;
  ts: number;
};

type VoiceState = {
  muted: boolean;
  speaking: boolean;
};

function peerConfigFromBase(base: string) {
  const u = new URL(base);
  const secure = u.protocol === "https:";
  const host = u.hostname;
  const port = u.port ? Number(u.port) : secure ? 443 : 80;
  return { host, port, secure, path: "/peerjs" as const };
}

function isTextInputTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;

  const tag = node.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (node.isContentEditable) return true;

  const closest = node.closest?.(
    "input, textarea, select, [contenteditable='true']"
  );
  return !!closest;
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => { });
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
}

type ChatPanelProps = {
  chatStatus: "connecting" | "ok" | "error";
  chatErrorMsg: string;
  messages: Msg[];
  meUid: string;
  pending: string;
  onPendingChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  className?: string;
};

const ChatPanel = memo(function ChatPanel({
  chatStatus,
  chatErrorMsg,
  messages,
  meUid,
  pending,
  onPendingChange,
  onSend,
  className = "",
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const statusChip =
    chatStatus === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : chatStatus === "error"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <aside
      className={`
        bg-white border border-slate-200 rounded-2xl flex flex-col
        ${className}
        lg:max-h-[calc(100vh-8rem)]
      `}
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Chat</h2>
        <span className={`text-[11px] px-2 py-1 rounded-full ${statusChip}`}>
          {chatStatus === "ok"
            ? "Conectado"
            : chatStatus === "error"
              ? "Sin chat"
              : "Conectando..."}
        </span>
      </div>

      {chatErrorMsg && (
        <div className="mx-4 mt-3 text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          {chatErrorMsg}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-slate-400">Aún no hay mensajes.</p>
        ) : (
          messages.map((m) => {
            const self = m.uid === meUid;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${self
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
        onSubmit={onSend}
        className="px-4 py-3 border-t border-slate-100 flex gap-2"
      >
        <input
          type="text"
          value={pending}
          onChange={(e) => onPendingChange(e.target.value)}
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
  );
});

type MeetingTileProps = {
  name: string;
  isMe?: boolean;
  muted?: boolean;
  speaking?: boolean;
};

function MeetingTile({ name, isMe, muted, speaking }: MeetingTileProps) {
  // borde brillante cuando habla
  const activeBorder =
    speaking && !muted
      ? " ring-4 ring-emerald-400/90 shadow-[0_0_40px_rgba(16,185,129,0.8)]"
      : "";

  return (
    <div
      className={
        "aspect-video max-h-[70vh] bg-[#1F2940] rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-150 ease-out" +
        activeBorder
      }
    >
      {/* “Interferencia” suave cuando habla */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150 ease-out bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.28)_0,transparent_55%)]"
        style={{ opacity: speaking && !muted ? 1 : 0 }}
      />

      {/* Nombre arriba */}
      <div className="absolute top-3 left-3 text-xs px-3 py-1 rounded-full bg-black/35 text-white">
        {isMe ? `Tú: ${name}` : name}
      </div>

      {/* Badge de silenciado (siempre que muted = true) */}
      {muted && (
        <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-black/60 text-red-400 flex items-center gap-1">
          <TbMicrophoneOff className="w-3.5 h-3.5" />
          <span>Silenciado</span>
        </div>
      )}

      {/* Badge de quien está hablando */}
      {speaking && !muted && (
        <div className="absolute bottom-3 right-4 text-xs px-2 py-1 rounded-full bg-emerald-500/90 text-white flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Hablando</span>
        </div>
      )}

      {/* Nombre abajo */}
      <div className="absolute bottom-3 left-4 text-sm text-slate-100 opacity-80">
        {name}
      </div>
    </div>
  );
}



export default function Meeting() {
  const { roomId: raw } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const isCreate =
    searchParams.get("new") === "1" || searchParams.get("host") === "1";

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const roomId = useMemo(
    () => (raw || "").trim().toUpperCase(),
    [raw]
  );

  const me = useMemo<Participant>(
    () => ({
      uid: user?.uid || "",
      name: user?.displayName || user?.email || "Guest",
    }),
    [user]
  );

  // Reunión (Firestore)
  const [status, setStatus] = useState<"connecting" | "ok" | "error">(
    "connecting"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fsReady, setFsReady] = useState(false);

  // Chat
  const [chatStatus, setChatStatus] = useState<
    "connecting" | "ok" | "error"
  >("connecting");
  const [chatErrorMsg, setChatErrorMsg] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState("");

  const [showChat, setShowChat] = useState(true);

  // Voz
  const [voiceStatus, setVoiceStatus] = useState<
    "idle" | "connecting" | "ok" | "error"
  >("idle");
  const [voiceErrorMsg, setVoiceErrorMsg] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [muted, setMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});

  // Estado de voz por usuario (mute / hablando)
  const [voiceStates, setVoiceStates] = useState<
    Record<string, VoiceState>
  >({});

  const leavingRef = useRef(false);

  const fsTokenRef = useRef(0);
  const chatTokenRef = useRef(0);
  const voiceTokenRef = useRef(0);

  const initialRoomRef = useRef("");
  const initialCreateRef = useRef(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const peersByUidRef = useRef<Map<string, VoicePeer>>(new Map());
  const callsByUidRef = useRef<Map<string, MediaConnection>>(new Map());
  const joinedVoiceRoomRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<
    Map<string, { analyser: AnalyserNode; data: Uint8Array }>
  >(new Map());

  const leave = () => navigate("/", { replace: true });

  const stopLocalStream = () => {
    const s = localStreamRef.current;
    if (!s) return;
    for (const t of s.getTracks()) t.stop();
    localStreamRef.current = null;
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {
      // ignore
    }
  };

  function ensureAudioCtx() {
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctor =
      (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctor) return null;
    audioCtxRef.current = new Ctor();
    return audioCtxRef.current;
  }

  function setupAnalyserFor(uid: string, stream: MediaStream) {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const data = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
      analysersRef.current.set(uid, { analyser, data });

      setVoiceStates((prev) => ({
        ...prev,
        [uid]: prev[uid] ?? { muted: false, speaking: false },
      }));
    } catch {
      // ignore
    }
  }

  function removeAnalyserFor(uid: string) {
    analysersRef.current.delete(uid);
    setVoiceStates((prev) => {
      if (!prev[uid]) return prev;
      const copy = { ...prev };
      delete copy[uid];
      return copy;
    });
  }

  function updateVoiceState(uid: string, patch: Partial<VoiceState>) {
    setVoiceStates((prev) => ({
      ...prev,
      [uid]: {
        muted: prev[uid]?.muted ?? false,
        speaking: prev[uid]?.speaking ?? false,
        ...patch,
      },
    }));
  }

  // Loop de detección de "quién habla"
useEffect(() => {
  let rafId: number;

  const tick = () => {
    const analyserMap = analysersRef.current;
    if (analyserMap.size === 0) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    setVoiceStates((prev) => {
      let changed = false;
      const next: Record<string, VoiceState> = { ...prev };

      analyserMap.forEach(({ analyser, data }, uid) => {
        // Rellenamos el buffer de frecuencias
        (analyser as any).getByteFrequencyData(data as any);

        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const nextSpeaking = avg > 28; // umbral simple

        // Respetamos SIEMPRE el muted actual
        const prevState: VoiceState =
          next[uid] ?? { muted: false, speaking: false };

        if (prevState.speaking !== nextSpeaking) {
          next[uid] = { ...prevState, speaking: nextSpeaking };
          changed = true;
        }
      });

      return changed ? next : prev;
    });

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(rafId);
}, []);





  // Normaliza roomId
  useEffect(() => {
    if (!roomId) {
      leave();
      return;
    }
    if (raw && raw !== roomId) {
      navigate(`/meeting/${roomId}${window.location.search}`, {
        replace: true,
      });
    }
  }, [roomId, raw, navigate]);

  // Reset cuando cambia de sala
  useEffect(() => {
    if (!roomId) return;

    if (initialRoomRef.current !== roomId) {
      initialRoomRef.current = roomId;
      initialCreateRef.current = isCreate;

      leavingRef.current = false;

      setStatus("connecting");
      setErrorMsg("");
      setParticipants([]);
      setFsReady(false);

      setChatStatus("connecting");
      setChatErrorMsg("");
      setMessages([]);
      setPending("");

      setVoiceStatus("idle");
      setVoiceErrorMsg("");
      setVoiceEnabled(false);
      setMuted(false);
      setRemoteStreams({});
      peersByUidRef.current.clear();
      callsByUidRef.current.clear();
      joinedVoiceRoomRef.current = false;

      stopLocalStream();
      setShowChat(true);
      setVoiceStates({});
      analysersRef.current.clear();
    }
  }, [roomId, isCreate]);

  // Atajos de teclado: Esc, C, M
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;

      const active = document.activeElement as HTMLElement | null;
      if (
        isTextInputTarget(e.target) ||
        (active &&
          (active.isContentEditable || isTextInputTarget(active as any)))
      ) {
        return;
      }

      const key = (e.key || "").toLowerCase();

      if (key === "escape") {
        if (showChat) {
          e.preventDefault();
          setShowChat(false);
        }
        return;
      }

      if (key === "c") {
        e.preventDefault();
        setShowChat((p) => !p);
        return;
      }

      if (key === "m") {
        if (voiceEnabled && voiceStatus === "ok") {
          e.preventDefault();
          const track = localStreamRef.current
            ?.getAudioTracks?.()[0] as MediaStreamTrack | undefined;
          setMuted((prev) => {
            const next = !prev;
            if (track) track.enabled = !next;
            updateVoiceState(me.uid, { muted: next });
            try {
              getVoiceSocket().emit("voice:state", {
                roomId,
                uid: me.uid,
                muted: next,
              });
            } catch { }
            return next;
          });
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [showChat, voiceEnabled, voiceStatus, roomId, me.uid]);

  // 1) Firestore: crear / validar + join + listen
  useEffect(() => {
    if (!roomId || !me.uid) return;

    const myToken = ++fsTokenRef.current;

    setStatus("connecting");
    setErrorMsg("");

    let unsub: (() => void) | null = null;

    (async () => {
      try {
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

        await joinMeetingFirestore(roomId, me);

        unsub = listenParticipants(roomId, (p) => {
          if (fsTokenRef.current !== myToken) return;
          setParticipants(p);
        });

        if (fsTokenRef.current !== myToken) return;
        setFsReady(true);
        setStatus("ok");
      } catch (err) {
        console.error("Firestore join error:", err);
        if (fsTokenRef.current !== myToken) return;
        setStatus("error");
        setErrorMsg(
          "No pude entrar a la reunión (Firestore). Revisa reglas/login."
        );
      }
    })();

    const onUnload = () => {
      if (leavingRef.current) return;
      leavingRef.current = true;

      stopLocalStream();

      leaveMeetingFirestore(roomId, me).catch(() => { });
      getChatSocket().emit("room:leave", { roomId, uid: me.uid });
      getVoiceSocket().emit("voice:leave", { roomId, uid: me.uid });
    };

    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      unsub?.();
    };
  }, [roomId, me.uid, me.name]);

  // 2) Chat
  useEffect(() => {
    if (!roomId || !me.uid) return;
    if (!fsReady) return;

    const myToken = ++chatTokenRef.current;

    setChatStatus("connecting");
    setChatErrorMsg("");

    const socket = getChatSocket();
    socket.connect();

    const onMsg = (payload: Msg) => {
      if (chatTokenRef.current !== myToken) return;
      if (payload.roomId !== roomId) return;
      setMessages((prev) => [...prev, payload]);
    };

    const doJoin = () => {
      if (chatTokenRef.current !== myToken) return;

      socket.emit(
        "room:join",
        { roomId, user: { uid: me.uid, name: me.name }, create: initialCreateRef.current },
        (ack: JoinAck) => {
          if (chatTokenRef.current !== myToken) return;

          if (!ack.ok) {
            setChatStatus("error");
            setChatErrorMsg(
              ack.error === "ROOM_NOT_FOUND"
                ? "Esperando al host para activar el chat..."
                : ack.error === "ROOM_FULL"
                  ? "La sala está llena (máximo 10 usuarios)."
                  : "No se pudo conectar al chat."
            );
            return;
          }

          setChatStatus("ok");
          setChatErrorMsg("");

          if (initialCreateRef.current) {
            navigate(`/meeting/${roomId}`, { replace: true });
          }
        }
      );
    };

    const onConnect = () => doJoin();

    const onConnectError = (e: any) => {
      console.error("chat socket connect_error:", e);
      if (chatTokenRef.current !== myToken) return;
      setChatStatus("error");
      setChatErrorMsg(
        "No se pudo conectar con chat-server. Revisa VITE_CHAT_BASE."
      );
    };

    socket.on("chat:message", onMsg);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);

    if (socket.connected) doJoin();

    return () => {
      socket.off("chat:message", onMsg);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    };
  }, [roomId, me.uid, me.name, fsReady, navigate]);

// 3) Voz: se inicia SOLO cuando voiceEnabled = true (click mic)
useEffect(() => {
  if (!voiceEnabled) return;
  if (!roomId || !me.uid) return;
  if (!fsReady) return;

  const myToken = ++voiceTokenRef.current;

  setVoiceStatus("connecting");
  setVoiceErrorMsg("");
  joinedVoiceRoomRef.current = false;

  const VOICE_BASE =
    (import.meta.env.VITE_VOICE_BASE as string) || "http://localhost:4010";
  const voiceSocket = getVoiceSocket();
  voiceSocket.connect();

  const stream = localStreamRef.current;
  if (!stream) {
    setVoiceStatus("error");
    setVoiceErrorMsg(
      "Micrófono no inicializado. Presiona el botón del micrófono."
    );
    setVoiceEnabled(false);
    return;
  }

  const cleanupPeerOnly = () => {
    for (const c of callsByUidRef.current.values()) {
      try {
        c.close();
      } catch {
        // ignore
      }
    }
    callsByUidRef.current.clear();

    setRemoteStreams({});

    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch {
        // ignore
      }
      peerRef.current = null;
    }

    peersByUidRef.current.clear();
  };

  const attachRemote = (uid: string, s: MediaStream) => {
    setRemoteStreams((prev) => ({ ...prev, [uid]: s }));
    setupAnalyserFor(uid, s);
  };

  const detachRemote = (uid: string) => {
    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[uid];
      return copy;
    });
    removeAnalyserFor(uid);
  };

  const shouldInitiateCall = (otherUid: string) => me.uid < otherUid;

  const placeCallTo = (other: VoicePeer) => {
    if (voiceTokenRef.current !== myToken) return;
    if (!peerRef.current) return;
    if (!localStreamRef.current) return;
    if (other.uid === me.uid) return;

    if (!shouldInitiateCall(other.uid)) return;
    if (callsByUidRef.current.has(other.uid)) return;

    const call = peerRef.current.call(other.peerId, localStreamRef.current, {
      metadata: { uid: me.uid, name: me.name },
    });

    callsByUidRef.current.set(other.uid, call);

    call.on("stream", (remoteStream) => attachRemote(other.uid, remoteStream));
    call.on("close", () => {
      callsByUidRef.current.delete(other.uid);
      detachRemote(other.uid);
    });
    call.on("error", () => {
      callsByUidRef.current.delete(other.uid);
    });
  };

  const onUserJoined = (p: VoicePeer) => {
    if (voiceTokenRef.current !== myToken) return;
    peersByUidRef.current.set(p.uid, p);
    updateVoiceState(p.uid, { muted: false, speaking: false });
    placeCallTo(p);
  };

  const onUserLeft = ({ uid }: { uid: string }) => {
    if (voiceTokenRef.current !== myToken) return;

    peersByUidRef.current.delete(uid);

    const call = callsByUidRef.current.get(uid);
    if (call) {
      try {
        call.close();
      } catch {
        // ignore
      }
      callsByUidRef.current.delete(uid);
    }

    detachRemote(uid);
  };

  const onVoiceState = ({ uid, muted }: { uid: string; muted: boolean }) => {
    if (voiceTokenRef.current !== myToken) return;
    updateVoiceState(uid, { muted });
  };

  voiceSocket.on("voice:user-joined", onUserJoined);
  voiceSocket.on("voice:user-left", onUserLeft);
  voiceSocket.on("voice:state", onVoiceState);

  let peer: Peer | null = null;

  try {
    const cfg = peerConfigFromBase(VOICE_BASE);
    const myPeerId =
      (globalThis.crypto?.randomUUID?.() ??
        `${me.uid}-${Math.random().toString(36).slice(2, 10)}`) as string;

    peer = new Peer(myPeerId, cfg);
    peerRef.current = peer;

    // Creamos estado base para mí sin tocar muted
    updateVoiceState(me.uid, { speaking: false });

    peer.on("open", (peerId) => {
      if (voiceTokenRef.current !== myToken) return;

      voiceSocket.emit(
        "voice:join",
        { roomId, uid: me.uid, name: me.name, peerId },
        (ack: VoiceJoinAck) => {
          if (voiceTokenRef.current !== myToken) return;

          if (!ack.ok) {
            setVoiceStatus("error");
            setVoiceErrorMsg("No pude unirme al voice-server.");
            setVoiceEnabled(false);
            return;
          }

          joinedVoiceRoomRef.current = true;

          peersByUidRef.current.clear();
          for (const p of ack.peers) {
            peersByUidRef.current.set(p.uid, p);
            updateVoiceState(p.uid, { muted: false, speaking: false });
          }

          for (const p of ack.peers) placeCallTo(p);

          setVoiceStatus("ok");
          setVoiceErrorMsg("");
        }
      );
    });

    peer.on("call", (call) => {
      if (voiceTokenRef.current !== myToken) return;
      if (!localStreamRef.current) return;

      call.answer(localStreamRef.current);

      let remoteUid = "";
      for (const v of peersByUidRef.current.values()) {
        if (v.peerId === call.peer) {
          remoteUid = v.uid;
          break;
        }
      }

      call.on("stream", (remoteStream) => {
        if (!remoteUid) return;
        attachRemote(remoteUid, remoteStream);
      });

      call.on("close", () => {
        if (remoteUid) detachRemote(remoteUid);
      });
    });

    peer.on("error", (e: any) => {
      console.error("peer error:", e);
      setVoiceStatus("error");
      const type = e?.type || e?.name || "unknown";
      const msg = e?.message ? ` — ${e.message}` : "";
      setVoiceErrorMsg(`PeerJS: ${type}${msg}`);
    });
  } catch (e) {
    console.error("voice init error:", e);
    setVoiceStatus("error");
    setVoiceErrorMsg("No se pudo iniciar la voz.");
    setVoiceEnabled(false);
  }

  return () => {
    voiceSocket.off("voice:user-joined", onUserJoined);
    voiceSocket.off("voice:user-left", onUserLeft);
    voiceSocket.off("voice:state", onVoiceState);

    if (joinedVoiceRoomRef.current) {
      try {
        voiceSocket.emit("voice:leave", { roomId, uid: me.uid });
      } catch {
        // ignore
      }
      joinedVoiceRoomRef.current = false;
    }

    cleanupPeerOnly();

    if (leavingRef.current) {
      stopLocalStream();
      removeAnalyserFor(me.uid);
    }
  };
}, [voiceEnabled, roomId, me.uid, me.name, fsReady]);


  const micErrorMessage = (e: any) => {
    const name = String(e?.name || "");
    const msg = String(e?.message || "");
    const host = window.location.hostname;
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isSecure = window.isSecureContext;

    if (
      (name === "NotAllowedError" || name === "SecurityError") &&
      !isSecure &&
      !isLocalhost
    ) {
      return "El navegador bloqueó el micrófono porque la página no es segura (HTTPS). Usa https:// o entra por localhost.";
    }

    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      if (/dismissed|dismiss|denied/i.test(msg)) {
        return "El permiso del micrófono fue bloqueado/cerrado. Revisa permisos del sitio y recarga la página.";
      }
      return "El navegador o el sistema bloqueó el micrófono. Revisa permisos del sitio y la privacidad del sistema (Windows).";
    }

    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return "No se encontró un micrófono. Conecta uno o revisa el dispositivo de entrada.";
    }

    if (name === "NotReadableError" || name === "TrackStartError") {
      return "No se pudo usar el micrófono (puede estar ocupado por otra app o en modo exclusivo).";
    }

    if (name === "OverconstrainedError") {
      return "El dispositivo no cumple los requisitos solicitados.";
    }

    return "No se pudo acceder al micrófono.";
  };

  const handleMicClick = async () => {
  if (voiceStatus === "connecting") return;

  // Primera vez o después de error: pedir permisos e iniciar voz
  if (!voiceEnabled || voiceStatus === "idle" || voiceStatus === "error") {
    setVoiceErrorMsg("");
    setVoiceStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (track) track.enabled = true;

      // Analizador local para detectar si hablas
      setupAnalyserFor(me.uid, stream);

      // Estado inicial: NO silenciado
      setMuted(false);
      updateVoiceState(me.uid, { muted: false, speaking: false });

      setVoiceEnabled(true);

      // Avisar al resto que entras con micro activo
      try {
        getVoiceSocket().emit("voice:state", {
          roomId,
          uid: me.uid,
          muted: false,
        });
      } catch {
        // ignore
      }
    } catch (e: any) {
      setVoiceStatus("error");
      const base = micErrorMessage(e);
      const debug = import.meta.env.DEV
        ? ` [${e?.name || "Error"}] ${e?.message || ""}`
        : "";
      setVoiceErrorMsg(base + debug);
      setVoiceEnabled(false);
      stopLocalStream();
      removeAnalyserFor(me.uid);
    }

    return;
  }

  // Ya está conectado: solo mute / unmute
  const track = localStreamRef.current?.getAudioTracks?.()[0];

  setMuted((prev) => {
    const next = !prev;
    if (track) track.enabled = !next;

    updateVoiceState(me.uid, { muted: next });

    try {
      getVoiceSocket().emit("voice:state", {
        roomId,
        uid: me.uid,
        muted: next,
      });
    } catch {
      // ignore
    }

    return next;
  });
};


  const handleToggleChat = () => setShowChat((p) => !p);

  const handleLeave = async () => {
    if (leavingRef.current) {
      leave();
      return;
    }

    leavingRef.current = true;

    stopLocalStream();
    removeAnalyserFor(me.uid);

    try {
      getChatSocket().emit("room:leave", { roomId, uid: me.uid });
      getVoiceSocket().emit("voice:leave", { roomId, uid: me.uid });
      await leaveMeetingFirestore(roomId, me);
    } catch {
      // ignore
    } finally {
      leave();
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatStatus !== "ok") return;

    const text = pending.trim();
    if (!text) return;

    getChatSocket().emit("chat:send", {
      roomId,
      text,
      user: { uid: me.uid, name: me.name },
    });
    setPending("");
  };

  const others = participants.filter((p) => p.uid !== me.uid);

  const myVoice = voiceStates[me.uid];
  const myMuted = myVoice?.muted ?? muted;

  const micButtonColor =
    voiceStatus === "error"
      ? "text-red-600"
      : myMuted
        ? "text-red-600"
        : "text-slate-700";


  return (
    <section className="min-h-screen bg-slate-50">
      {/* audios remotos (invisibles) */}
      <div
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        {Object.entries(remoteStreams).map(([uid, stream]) => (
          <RemoteAudio key={uid} stream={stream} />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-10">
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">Reunión</h1>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${status === "ok"
                    ? "bg-emerald-50 text-emerald-700"
                    : status === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                    }`}
                >
                  {status === "ok"
                    ? "En sala"
                    : status === "error"
                      ? "Error"
                      : "Entrando..."}
                </span>

                <span
                  className={`text-xs px-3 py-1 rounded-full ${voiceStatus === "ok"
                    ? myMuted
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                    : voiceStatus === "error"
                      ? "bg-red-50 text-red-700"
                      : voiceStatus === "connecting"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {voiceStatus === "ok"
                    ? myMuted
                      ? "Voz: Silenciada"
                      : "Voz: Conectada"
                    : voiceStatus === "error"
                      ? "Voz: Error"
                      : voiceStatus === "connecting"
                        ? "Voz: Conectando..."
                        : "Voz: Desactivada"}
                </span>

              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="font-medium text-slate-500">ID:</span>
                  <span className="font-semibold tracking-widest">
                    {roomId}
                  </span>
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
                <button
                  onClick={leave}
                  className="underline font-semibold"
                >
                  Volver al inicio
                </button>
              </div>
            )}

            {voiceStatus === "error" && voiceErrorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {voiceErrorMsg}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div
                className={`grid gap-4 ${others.length === 0
                  ? "grid-cols-1"
                  : "grid-cols-1 md:grid-cols-2"
                  }`}
              >
                <MeetingTile
                  name={me.name}
                  isMe
                  muted={myMuted}
                  speaking={myVoice?.speaking ?? false}
                />


                {others.map((u) => {
                  const vs = voiceStates[u.uid];
                  return (
                    <MeetingTile
                      key={u.uid}
                      name={u.name}
                      muted={vs?.muted ?? false}
                      speaking={vs?.speaking ?? false}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="bg-white border border-slate-200 shadow-lg rounded-2xl px-8 py-3 flex items-center gap-6">
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`p-2 rounded-lg hover:bg-slate-100 ${micButtonColor}`}
                  aria-label={
                    !voiceEnabled ||
                      voiceStatus === "idle" ||
                      voiceStatus === "error"
                      ? "Activar micrófono"
                      : muted
                        ? "Activar micrófono"
                        : "Silenciar micrófono"
                  }
                  aria-pressed={voiceEnabled && !muted}
                >
                  <TbMicrophone className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100"
                  aria-label="Cámara (no implementada)"
                >
                  <TbCamera className="w-6 h-6 text-slate-700" />
                </button>

                <button
                  type="button"
                  onClick={handleToggleChat}
                  className={`p-2 rounded-lg hover:bg-slate-100 ${showChat ? "text-blue-700" : "text-slate-700"
                    }`}
                  aria-label={showChat ? "Cerrar chat" : "Abrir chat"}
                  aria-pressed={showChat}
                >
                  <TbMessageCircle className="w-6 h-6" />
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

          {/* Chat desktop */}
          {showChat && (
            <ChatPanel
              className="hidden lg:flex w-[340px] shrink-0"
              chatStatus={chatStatus}
              chatErrorMsg={chatErrorMsg}
              messages={messages}
              meUid={me.uid}
              pending={pending}
              onPendingChange={setPending}
              onSend={send}
            />
          )}
        </div>
      </div>

      {/* Chat móvil */}
      {showChat && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowChat(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[92vw] max-w-[380px] p-3">
            <div
              className="h-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="absolute right-3 top-3 z-10 p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
                aria-label="Cerrar chat"
              >
                <TbX className="w-5 h-5 text-slate-700" />
              </button>

              <ChatPanel
                className="h-full w-full"
                chatStatus={chatStatus}
                chatErrorMsg={chatErrorMsg}
                messages={messages}
                meUid={me.uid}
                pending={pending}
                onPendingChange={setPending}
                onSend={send}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
