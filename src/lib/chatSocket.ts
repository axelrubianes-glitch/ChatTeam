import { io, type Socket } from "socket.io-client";

export type JoinAck =
  | { ok: true; count: number }
  | { ok: false; error: "BAD_REQUEST" | "ROOM_FULL" | "ROOM_NOT_FOUND" };

type ClientToServerEvents = {
  "room:join": (
    payload: { roomId: string; user: { uid: string; name: string }; create?: boolean },
    ack: (res: JoinAck) => void
  ) => void;
  "room:leave": (payload: { roomId: string; uid: string }) => void;
  "chat:send": (payload: { roomId: string; text: string; user: { uid: string; name: string } }) => void;
};

type ServerToClientEvents = {
  "room:users": (payload: { roomId: string; users: Array<{ uid: string; name: string }> }) => void;
  "chat:message": (payload: { id: string; roomId: string; uid: string; name: string; text: string; ts: number }) => void;
};

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getChatSocket() {
  if (socket) return socket;

  const url = import.meta.env.VITE_CHAT_BASE || "http://localhost:4001";
  console.log("🧩 [chatSocket] URL:", url);

  socket = io(url, {
    // ✅ permite fallback (si websocket falla por algo)
    transports: ["polling", "websocket"],
    withCredentials: true,
    autoConnect: true,
    timeout: 10000,
    reconnection: true,
  });

  socket.on("connect", () => console.log("✅ [chatSocket] connected:", socket?.id));
  socket.on("disconnect", (r) => console.log("⚠️ [chatSocket] disconnected:", r));
  socket.on("connect_error", (e) => console.log("❌ [chatSocket] connect_error:", e?.message || e));

  return socket;
}
