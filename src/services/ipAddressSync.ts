import { getItem, setItem } from "../components/utils/local-storage";

const IP_STORAGE_KEY = "ip_address";
const IP_REFRESH_MS = 20 * 60 * 1000;
const IPIFY_URL = "https://api64.ipify.org?format=json";

type StoredIpAddress = {
    ip: string;
    updatedAt: number;
};

export async function fetchAndStoreIpAddress(): Promise<string | null> {
    try {
        const response = await fetch(IPIFY_URL);
        const data = await response.json();
        const ip = typeof data?.ip === "string" ? data.ip : null;

        if (ip) {
            await setItem(IP_STORAGE_KEY, { ip, updatedAt: Date.now() });
        }

        return ip;
    } catch {
        return null;
    }
}

export async function getStoredIpAddress(): Promise<string | null> {
    const stored = (await getItem(IP_STORAGE_KEY)) as StoredIpAddress | null;
    return stored?.ip ?? null;
}

export function startIpAddressSync(): () => void {
    void fetchAndStoreIpAddress();

    const timer = setInterval(() => {
        void fetchAndStoreIpAddress();
    }, IP_REFRESH_MS);

    return () => clearInterval(timer);
}
