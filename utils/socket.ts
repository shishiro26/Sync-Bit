import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://192.168.1.26:3000";

export const socket: Socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

socket.on("connect_error", (err) => {
  console.warn("Connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.io.on("reconnect", (attempt) => {
  console.log("Reconnected after", attempt, "attempts");
});
