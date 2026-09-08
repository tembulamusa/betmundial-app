import socket from "../components/utils/SocketConnect";
import { getOrCreateDeviceId } from "./deviceId";

export type OtpDeliveryChannel = "sms" | "whatsapp";

export type DeviceChannelMessage = {
    channel?: OtpDeliveryChannel | string;
    enable_whatsapp?: boolean;
    whatsapp?: boolean;
    message?: string;
    type?: string;
    msisdn?: string;
    [key: string]: any;
};

/** Matches match/profile subscription style: emit listen, receive on channel. */
export function getDeviceSocketEvent(deviceId: string) {
    return `socket-io#${deviceId}`;
}

export function emitDeviceListen(deviceId: string) {
    if (!socket.connected) {
        socket.connect();
    }
    socket.emit("user.device.listen", deviceId);
}

export function emitOtpChannelSelection(payload: {
    device_id: string;
    channel: OtpDeliveryChannel;
    msisdn?: string;
}) {
    if (!socket.connected) {
        socket.connect();
    }
    socket.emit("user.otp.channel", payload);
}

/**
 * Subscribe to device channel. Returns cleanup.
 * Mirrors HeaderUser / match listen patterns.
 */
export async function subscribeDeviceChannel(
    onMessage: (data: DeviceChannelMessage) => void
): Promise<{ deviceId: string; cleanup: () => void }> {
    const deviceId = await getOrCreateDeviceId();
    const event = getDeviceSocketEvent(deviceId);

    const subscribe = () => emitDeviceListen(deviceId);

    if (!socket.connected) {
        socket.connect();
    }
    subscribe();
    socket.on("connect", subscribe);
    socket.on(event, onMessage);
    // Alternate naming used elsewhere for profile-style channels
    const altEvent = `user#device#${deviceId}`;
    socket.on(altEvent, onMessage);

    return {
        deviceId,
        cleanup: () => {
            socket.off("connect", subscribe);
            socket.off(event, onMessage);
            socket.off(altEvent, onMessage);
        },
    };
}
