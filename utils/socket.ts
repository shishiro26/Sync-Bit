import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://192.168.1.14:3000";

let isAlreadyConnected = false;

export const socket: Socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  if (!isAlreadyConnected) {
    console.log("Connected to server");
    isAlreadyConnected = true;
  }
});

socket.on("connect_error", (err) => {
  console.warn("Connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  isAlreadyConnected = false;
  console.log("Disconnected:", reason);
});

socket.io.on("reconnect", (attempt) => {
  console.log("Reconnected after", attempt, "attempts");
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log("Reconnect attempt", attempt);
});
socket.io.on("reconnect_error", (err) => {
  console.warn("Reconnect error", err);
});
socket.io.on("reconnect_failed", () => {
  console.warn("Reconnect failed");
});

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
