import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import Config from "react-native-config";
import { getItem } from "./local-storage";

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
    token?: string; // ✅ allow override from context
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
 * 🔥 Default API Fallbacks
 */
const API_DEFAULTS: Record<ApiVersion, string> = {
    1: "https://api.betmundial.com/",
    2: "https://api.betmundial.com/v2",
    3: "https://api.betmundial.com/api/accounts/",
    sureCoin: "https://api.betmundial.com/v1/surecoin/user/",
    sureBox: "https://api.betmundial.com/v1/surebox/",
    casinoGames: "https://api.betmundial.com/api/casino/",
    CasinoGameLaunch: "https://api.betmundial.com/api/",
    casinoJackpots: "https://api.betmundial.com/pragmatic",
};

/**
 * 🔥 Environment Map (RN + Web compatible)
 */
const API_MAP: Record<ApiVersion, string> = {
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
 * 🔐 Get token from AsyncStorage
 */
const getAuthToken = async (): Promise<string | null> => {
    try {
        const user = await getItem("user");
        return user?.access_token || user?.token || null;
    } catch {
        return null;
    }
};

/**
 * ⏱ Fetch with timeout
 */
const fetchWithTimeout = async (
    resource: RequestInfo,
    options: RequestInit,
    timeout = 15000
): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(id);
    }
};

/**
 * 🚀 MAIN REQUEST FUNCTION
 */
export const makeRequest = async <T = any>({
    url,
    method = "GET",
    data,
    token, // optional override
    apiVersion = 1,
    responseType = "json",
    timeout = 15000,
}: MakeRequestParams): Promise<ApiResponse<T>> => {
    try {
        const baseUrl = API_MAP[apiVersion];
        const fullUrl = `${baseUrl}${url}`;

        // 🔐 Get token (priority: passed token > storage)
        const user = await getItem("user");
        const authToken = token || user?.access_token || user?.token;

        const headers: Record<string, string> = {
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
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