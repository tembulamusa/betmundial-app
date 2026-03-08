import AsyncStorage from "@react-native-async-storage/async-storage";
import Config from "react-native-config";

export type ApiVersion =
    | 1
    | 2
    | 3
    | "sureCoin"
    | "sureBox"
    | "casinoGames"
    | "CasinoGameLaunch"
    | "casinoJackpots";

export interface MakeRequestParams<T = any> {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    data?: any;
    useJwt?: boolean;
    apiVersion?: ApiVersion;
    responseType?: "json" | "text";
    timeout?: number;
}

export interface ApiResponse<T = any> {
    status: number;
    data: T | null;
    error?: string;
}

/**
 * 🔥 Centralized API Base Map
 *
 * Mirrors the React web project logic (process.env.REACT_APP_*)
 * and provides safe fallbacks so apiVersion is never missing.
 */
const API_DEFAULTS: Record<ApiVersion, string> = {
    1: "https://apistaging.betmundial.com/",
    2: "https://apistaging.betmundial.com/v2",
    3: "https://api.betmundial.com/api/accounts/",
    sureCoin: "https://apistaging.betmundial.com/v1/surecoin/user/",
    sureBox: "https://apistaging.betmundial.com/v1/surebox/",
    casinoGames: "https://apistaging.betmundial.com/api/casino/",
    CasinoGameLaunch: "https://apistaging.betmundial.com/api/",
    casinoJackpots: "https://apistaging.betmundial.com/pragmatic",
};

const API_MAP: Record<ApiVersion, string> = {
    // Support both RN-style keys and existing REACT_APP_* keys (from web envs),
    // and finally fall back to known-good defaults from the React project.
    1: (Config.BASE_URL ?? (Config as any).REACT_APP_BASE_URL ?? API_DEFAULTS[1]) as string,
    2: (Config.BASE2_URL ?? (Config as any).REACT_APP_BASE2_URL ?? API_DEFAULTS[2]) as string,
    3: (Config.ACCOUNTS_URL ?? (Config as any).REACT_APP_ACCOUNTS_URL ?? API_DEFAULTS[3]) as string,
    sureCoin: (Config.SURECOIN_URL ?? (Config as any).REACT_APP_SURECOIN_URL ?? API_DEFAULTS.sureCoin) as string,
    sureBox: (Config.SUREBOX_URL ?? (Config as any).REACT_APP_SUREBOX_URL ?? API_DEFAULTS.sureBox) as string,
    casinoGames: (Config.CASINOGAMES ?? (Config as any).REACT_APP_CASINO_URL ?? API_DEFAULTS.casinoGames) as string,
    CasinoGameLaunch: (Config.CASINOGAMELaunch ?? (Config as any).REACT_APP_CASINO_LAUNCH_URL ?? API_DEFAULTS.CasinoGameLaunch) as string,
    casinoJackpots: (Config.PRAGMATIC_JACKPOT_URL ?? (Config as any).REACT_APP_PRAGMATIC_JACKPOT_URL ?? API_DEFAULTS.casinoJackpots) as string,
};

/**
 * 🔥 Helper: Get Stored Token
 */
const getAuthToken = async (): Promise<string | null> => {
    try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return null;

        const user = JSON.parse(userString);
        return user?.token ?? null;
    } catch {
        return null;
    }
};

/**
 * 🔥 Helper: Timeout Wrapper
 */
const fetchWithTimeout = async (
    resource: RequestInfo,
    options: RequestInit,
    timeout = 15000
): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal,
    });

    clearTimeout(id);
    return response;
};

/**
 * 🚀 Production-Ready Request Function
 */
export const makeRequest = async <T = any>({
    url,
    method = "GET",
    data,
    useJwt = true,
    apiVersion = 1,
    responseType = "json",
    timeout = 15000,
}: MakeRequestParams): Promise<ApiResponse<T>> => {
    try {
        const baseUrl = API_MAP[apiVersion];

        const fullUrl = `${baseUrl}${url}`;

        const headers: Record<string, string> = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        if (useJwt) {
            const token = await getAuthToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        const requestOptions: RequestInit = {
            method,
            headers,
        };

        if (data) {
            requestOptions.body = JSON.stringify(data);
        }

        const response = await fetchWithTimeout(fullUrl, requestOptions, timeout);

        let parsedData: any = null;

        if (responseType === "text") {
            parsedData = await response.text();
        } else {
            const text = await response.text();
            parsedData = text ? JSON.parse(text) : null;
        }

        if (!response.ok) {
            return {
                status: response.status,
                data: null,
                error:
                    parsedData?.message ||
                    parsedData?.error ||
                    "Something went wrong",
            };
        }

        return {
            status: response.status,
            data: parsedData as T,
        };
    } catch (error: any) {
        return {
            status: 0,
            data: null,
            error:
                error?.name === "AbortError"
                    ? "Request timeout"
                    : error?.message || "Network error",
        };
    }
};