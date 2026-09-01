import socket from "../components/utils/SocketConnect";
import { removeItem } from "../components/utils/local-storage";

export type SessionDispatch = (action: {
    type: string;
    key?: string;
    payload?: any;
}) => void;

let sessionDispatch: SessionDispatch | null = null;

export function registerSessionDispatch(dispatch: SessionDispatch) {
    sessionDispatch = dispatch;
}

export function getSessionDispatch() {
    return sessionDispatch;
}

export async function clearSessionAndPromptLogin(
    dispatch?: SessionDispatch | null,
    message = "User Session Expired. Please Login Again"
) {
    const activeDispatch = dispatch || sessionDispatch;

    await removeItem("user");
    await removeItem("token");

    if (socket.connected) {
        socket.disconnect();
    }

    if (!activeDispatch) return;

    activeDispatch({ type: "DEL", key: "user" });
    activeDispatch({ type: "DEL", key: "showloginmodal" });
    activeDispatch({ type: "SET", key: "showloginmodal", payload: true });
    activeDispatch({
        type: "SET",
        key: "sessionMessage",
        payload: message,
    });
}
