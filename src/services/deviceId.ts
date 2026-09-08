import { getItem, setItem } from "../components/utils/local-storage";

const DEVICE_ID_KEY = "deviceUID";

function createDeviceId(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const time = Date.now().toString(36);
    return `bm-${time}-${rand}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
    const existing = await getItem(DEVICE_ID_KEY);
    if (typeof existing === "string" && existing.length > 0) {
        return existing;
    }
    // Older builds may have stored a raw AsyncStorage string
    try {
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        const raw = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (raw && !raw.startsWith("{") && !raw.startsWith("[")) {
            await setItem(DEVICE_ID_KEY, raw);
            return raw;
        }
    } catch {
        /* ignore */
    }

    const next = createDeviceId();
    await setItem(DEVICE_ID_KEY, next);
    return next;
}
