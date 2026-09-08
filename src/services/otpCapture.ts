import { AppState, NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from "react-native";
import SmsRetriever from "react-native-sms-retriever";

async function readClipboard(): Promise<string> {
    try {
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
export type OtpChannel = "sms" | "whatsapp" | "both";

export type OtpCaptureHandler = (otp: string, source: OtpSource) => void;

const OTP_REGEX = /\b(\d{4,8})\b/;
/** Strict: only BetMundial-branded messages */
const BETMUNDIAL_STRICT = /bet\s*mundial|betmundial/i;

type StopFn = () => void;

export function isBetMundialMessage(text: string | null | undefined): boolean {
    return !!text && BETMUNDIAL_STRICT.test(text);
}

export function extractBetMundialOtp(text: string | null | undefined): string | null {
    if (!isBetMundialMessage(text)) return null;
    const match = String(text).match(OTP_REGEX);
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
            result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] ===
                PermissionsAndroid.RESULTS.GRANTED ||
            result[PermissionsAndroid.PERMISSIONS.READ_SMS] ===
                PermissionsAndroid.RESULTS.GRANTED
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
            const otp = extractBetMundialOtp(event?.message);
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
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const SmsListener = require("react-native-android-sms-listener").default;
        const subscription = SmsListener.addListener(
            (message: { body?: string; originatingAddress?: string }) => {
                const body = message?.body || "";
                const from = message?.originatingAddress || "";
                if (!isBetMundialMessage(body) && !isBetMundialMessage(from)) return;
                const otp = extractBetMundialOtp(body) || extractBetMundialOtp(`${from} ${body}`);
                if (otp) onOtp(otp, "sms");
            }
        );
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
                maxCount: 15,
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
                            if (!isBetMundialMessage(blob)) continue;
                            const otp = extractBetMundialOtp(blob);
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
            /* unavailable */
        }
    };

    await scan();
    const timer = setInterval(scan, 4000);
    return () => {
        stopped = true;
        clearInterval(timer);
    };
}

async function startWhatsAppCapture(onOtp: OtpCaptureHandler): Promise<StopFn> {
    const stops: StopFn[] = [];

    let lastClip: string | null = null;
    const readClip = async () => {
        try {
            const text = await readClipboard();
            if (!text || text === lastClip) return;
            lastClip = text;
            const otp = extractBetMundialOtp(text);
            if (otp) onOtp(otp, "clipboard");
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

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const RNAndroidNotificationListener = require("react-native-android-notification-listener");
        if (RNAndroidNotificationListener?.default) {
            const emitter = new NativeEventEmitter(
                NativeModules.RNAndroidNotificationListener ||
                    NativeModules.NotificationListener
            );
            const sub = emitter.addListener("notificationReceived", (event: any) => {
                const app = String(
                    event?.app || event?.package || event?.packageName || ""
                ).toLowerCase();
                const title = String(event?.title || "");
                const text = String(event?.text || event?.bigText || event?.message || "");
                const isWhatsApp =
                    app.includes("whatsapp") ||
                    /whatsapp/i.test(title) ||
                    /whatsapp/i.test(text);
                if (!isWhatsApp) return;
                const otp = extractBetMundialOtp(`${title} ${text}`);
                if (otp) onOtp(otp, "whatsapp");
            });
            stops.push(() => sub.remove());
        }
    } catch {
        /* optional */
    }

    return () => stops.forEach((s) => s());
}

export type StartOtpCaptureOptions = {
    /** Default `both` — first BetMundial OTP from SMS or WhatsApp wins */
    channel?: OtpChannel;
};

/**
 * Capture BetMundial OTPs only. Listens to SMS and/or WhatsApp depending on channel.
 */
export async function startOtpCapture(
    onOtp: OtpCaptureHandler,
    options: StartOtpCaptureOptions = {}
): Promise<StopFn> {
    const channel: OtpChannel = options.channel || "both";
    const stops: StopFn[] = [];

    if (channel === "sms" || channel === "both") {
        if (Platform.OS === "android") {
            await requestSmsPermissions();
            stops.push(
                ...(await Promise.all([
                    startSmsRetriever(onOtp),
                    startSmsBroadcastListener(onOtp),
                    pollSmsInbox(onOtp),
                ]))
            );
        }
    }

    if (channel === "whatsapp" || channel === "both") {
        stops.push(await startWhatsAppCapture(onOtp));
    }

    return () => stops.forEach((s) => s());
}
