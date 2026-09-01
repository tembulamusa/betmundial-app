import io from "socket.io-client";

const socket = io("https://wss.betmundial.com/socket-io", {
    transports: ["websocket"],
    reconnection: true,
    upgrade: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    timeout: 10000,
});

socket.on("connect", () => {
    console.log("[socket] connected", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected", reason);
});

socket.on("connect_error", (err) => {
    console.error("[socket] connect_error", err?.message || err);
});

if (socket.io && typeof socket.io.on === "function") {
    socket.io.on("reconnect_attempt", (attempt) => {
        console.log("[socket] reconnect_attempt", attempt);
    });
    socket.io.on("reconnect_error", (error) => {
        console.log("[socket] reconnect_error", error?.message || error);
    });
    socket.io.on("reconnect_failed", () => {
        console.log("[socket] reconnect_failed");
    });
}

setInterval(() => {
    if (!socket.connected) {
        socket.connect();
    }
}, 5 * 60 * 1000);

export default socket;
