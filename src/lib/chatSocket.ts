// src/lib/chatSocket.ts
/**
 * Singleton Socket.IO client for ChatTeam
 */

import { io, type Socket } from "socket.io-client";

type JoinAck = { ok: boolean; error?: string; count?: number };

type ClientToServerEvents = {
  "room:join": (
    payload: { roomId: string; create?: boolean; user: { uid: string; name: string } },
    ack: (res: JoinAck) => void
  ) => void;
  "chat:send": (payload: { roomId: string; text: string; user: { uid: string; name: string } }) => void;
};

type ServerToClientEvents = {
  "room:users": (payload: { roomId: string; users: Array<{ uid: string; name: string }> }) => void;
  "chat:message": (payload: { id: string; roomId: string; uid: string; name: string; text: string; ts: number }) => void;
  "room:error": (payload: { message: string }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getChatSocket() {
  if (socket) return socket;

  const url = import.meta.env.VITE_CHAT_URL || "http://localhost:4001";

  socket = io(url, {
    transports: ["websocket"], // más estable en Render
    autoConnect: true,
    withCredentials: true,
  });

  return socket;
}

export type { JoinAck, ClientToServerEvents, ServerToClientEvents };
