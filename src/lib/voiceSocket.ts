import { io, type Socket } from "socket.io-client";

export type VoicePeer = { uid: string; name: string; peerId: string };

export type VoiceJoinAck =
  | { ok: true; peers: VoicePeer[] }
  | { ok: false; error?: "BAD_REQUEST" };

// Estado que el cliente envía al servidor
export type VoiceStatePayload = {
  roomId: string;
  uid: string;
  muted: boolean;
  speaking?: boolean; // opcional, por si quieres mandar también si está hablando
};

type ClientToServerEvents = {
  "voice:join": (
    payload: { roomId: string; uid: string; name: string; peerId: string },
    ack: (res: VoiceJoinAck) => void
  ) => void;

  "voice:leave": (payload: { roomId: string; uid: string }) => void;

  // nuevo evento: el cliente informa su estado de voz (mute / hablando)
  "voice:state": (payload: VoiceStatePayload) => void;
};

type ServerToClientEvents = {
  "voice:user-joined": (payload: VoicePeer) => void;
  "voice:user-left": (payload: { uid: string }) => void;

  // nuevo evento: el servidor retransmite el estado de un usuario
  "voice:state": (payload: { uid: string; muted: boolean; speaking: boolean }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getVoiceSocket() {
  if (socket) return socket;

  const url = (import.meta.env.VITE_VOICE_BASE as string) || "http://localhost:4010";

  socket = io(url, {
    transports: ["polling", "websocket"],
    autoConnect: true,
    withCredentials: true,
  });

  return socket;
}

export type { ClientToServerEvents, ServerToClientEvents };
