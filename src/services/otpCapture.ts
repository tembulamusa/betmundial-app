import { AppState, NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from "react-native";
import SmsRetriever from "react-native-sms-retriever";

async function readClipboard(): Promise<string> {
    try {
        // Prefer community clipboard if present; fall back to legacy RN Clipboard
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const community = require("@react-native-clipboard/clipboard").default;
        if (community?.getString) return await community.getString();
    } catch {
        /* optional */
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Clipboard } = require("react-native");
        if (Clipboard?.getString) return await Clipboard.getString();
    } catch {
        /* ignore */
    }
    return "";
}

export type OtpSource = "sms" | "whatsapp" | "clipboard" | "inbox";

export type OtpCaptureHandler = (otp: string, source: OtpSource) => void;

const OTP_REGEX = /\b(\d{4,8})\b/;
const BETMUNDIAL_HINT = /bet\s*mundial|betmundial|verification|otp|one[-\s]?time|code/i;

type StopFn = () => void;

function extractOtp(text: string | null | undefined): string | null {
    if (!text) return null;
    if (!BETMUNDIAL_HINT.test(text) && !/\botp\b|\bcode\b|\bpin\b/i.test(text)) {
        // Still accept a bare OTP-looking message that looks like a verification SMS
        const bare = text.trim().match(OTP_REGEX);
        if (bare && text.length <= 200) return bare[1];
        return null;
    }
    const match = text.match(OTP_REGEX);
    return match?.[1] ?? null;
}

async function requestSmsPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return false;
    try {
        const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
            PermissionsAndroid.PERMISSIONS.READ_SMS,
        ]);
        return (
            result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED ||
            result[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED
        );
    } catch {
        return false;
    }
}

async function startSmsRetriever(onOtp: OtpCaptureHandler): Promise<StopFn> {
    if (Platform.OS !== "android") return () => undefined;
    try {
        await SmsRetriever.startSmsRetriever();
        SmsRetriever.addSmsListener((event: { message?: string }) => {
            const otp = extractOtp(event?.message);
            if (otp) onOtp(otp, "sms");
            try {
                SmsRetriever.removeSmsListener();
            } catch {
                /* ignore */
            }
        });
    } catch {
        /* ignore */
    }
    return () => {
        try {
            SmsRetriever.removeSmsListener();
        } catch {
            /* ignore */
        }
    };
}

async function startSmsBroadcastListener(onOtp: OtpCaptureHandler): Promise<StopFn> {
    if (Platform.OS !== "android") return () => undefined;
    try {
        // Optional dependency — may be missing until native rebuild
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const SmsListener = require("react-native-android-sms-listener").default;
        const subscription = SmsListener.addListener((message: { body?: string; originatingAddress?: string }) => {
            const body = message?.body || "";
            const from = message?.originatingAddress || "";
            if (!BETMUNDIAL_HINT.test(body) && !BETMUNDIAL_HINT.test(from) && !extractOtp(body)) {
                return;
            }
            const otp = extractOtp(body);
            if (otp) onOtp(otp, "sms");
        });
        return () => {
            try {
                subscription?.remove?.();
            } catch {
                /* ignore */
            }
        };
    } catch {
        return () => undefined;
    }
}

async function pollSmsInbox(onOtp: OtpCaptureHandler): Promise<StopFn> {
    if (Platform.OS !== "android") return () => undefined;
    let stopped = false;
    let lastSeen: string | null = null;

    const scan = async () => {
        if (stopped) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const SmsAndroid = require("react-native-get-sms-android");
            const filter = JSON.stringify({
                box: "inbox",
                maxCount: 12,
                indexFrom: 0,
            });
            SmsAndroid.list(
                filter,
                () => undefined,
                (_count: number, smsList: string) => {
                    try {
                        const messages = JSON.parse(smsList) as Array<{
                            body?: string;
                            address?: string;
                            date?: string;
                        }>;
                        for (const msg of messages) {
                            const blob = `${msg.address || ""} ${msg.body || ""}`;
                            if (!BETMUNDIAL_HINT.test(blob) && !extractOtp(msg.body || "")) continue;
                            const otp = extractOtp(msg.body || "");
                            if (!otp) continue;
                            const key = `${msg.date || ""}:${otp}`;
                            if (key === lastSeen) continue;
                            lastSeen = key;
                            onOtp(otp, "inbox");
                            break;
                        }
                    } catch {
                        /* ignore */
                    }
                }
            );
        } catch {
            /* package / permission unavailable */
        }
    };

    await scan();
    const timer = setInterval(scan, 4000);
    return () => {
        stopped = true;
        clearInterval(timer);
    };
}

/**
 * WhatsApp OTP: listen via notification module when available,
 * and also watch the clipboard when the app returns to foreground
 * (common when users copy a code from WhatsApp).
 */
async function startWhatsAppCapture(onOtp: OtpCaptureHandler): Promise<StopFn> {
    const stops: StopFn[] = [];

    // Clipboard poll (WhatsApp copy / share OTP)
    let lastClip: string | null = null;
    const readClip = async () => {
        try {
            const text = await readClipboard();
            if (!text || text === lastClip) return;
            lastClip = text;
            const otp = extractOtp(text);
            if (otp && text.length <= 64) onOtp(otp, "clipboard");
        } catch {
            /* ignore */
        }
    };

    const appSub = AppState.addEventListener("change", (state) => {
        if (state === "active") void readClip();
    });
    const clipTimer = setInterval(() => void readClip(), 2500);
    void readClip();
    stops.push(() => {
        appSub.remove();
        clearInterval(clipTimer);
    });

    // Optional notification listener (WhatsApp notifications)
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RNAndroidNotificationListener = require("react-native-android-notification-listener");
        if (RNAndroidNotificationListener?.default) {
            const emitter = new NativeEventEmitter(
                NativeModules.RNAndroidNotificationListener || NativeModules.NotificationListener
            );
            const sub = emitter.addListener("notificationReceived", (event: any) => {
                const app = String(event?.app || event?.package || event?.packageName || "").toLowerCase();
                const title = String(event?.title || "");
                const text = String(event?.text || event?.bigText || event?.message || "");
                const isWhatsApp =
                    app.includes("whatsapp") ||
                    /whatsapp/i.test(title) ||
                    /whatsapp/i.test(text);
                if (!isWhatsApp) return;
                const otp = extractOtp(`${title} ${text}`);
                if (otp) onOtp(otp, "whatsapp");
            });
            stops.push(() => sub.remove());
        }
    } catch {
        /* optional */
    }

    return () => stops.forEach((s) => s());
}

/**
 * Start capturing OTPs from SMS (BetMundial) and WhatsApp-related sources.
 * Returns a cleanup function.
 */
export async function startOtpCapture(onOtp: OtpCaptureHandler): Promise<StopFn> {
    if (Platform.OS !== "android") {
        // iOS: clipboard only
        return startWhatsAppCapture(onOtp);
    }

    await requestSmsPermissions();

    const stops = await Promise.all([
        startSmsRetriever(onOtp),
        startSmsBroadcastListener(onOtp),
        pollSmsInbox(onOtp),
        startWhatsAppCapture(onOtp),
    ]);

    return () => stops.forEach((s) => s());
}
