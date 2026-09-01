import type { ApiResponse } from "../utils/makeRequest";

export type PlaceBetMessage = {
    status: number;
    message: string;
    title?: string;
};

export const extractPlaceBetError = (
    res: ApiResponse,
    fallback = "Error attempting to place bet"
): string => {
    const body: any = res.data;

    if (typeof res.error === "string" && res.error.trim()) {
        return res.error;
    }

    if (body) {
        return (
            body.message ||
            body?.error?.message ||
            (typeof body.error === "string" ? body.error : null) ||
            body.result ||
            fallback
        );
    }

    return fallback;
};

export const isPlaceBetSuccess = (res: ApiResponse, jackpot?: boolean) => {
    if (jackpot && (res.status == 200 || res.status == 201)) {
        const body: any = res.data;
        if (!body || body.status == undefined || body.status == null) {
            return true;
        }
        return body.status == 200 || body.status == 201;
    }

    if (res.status != 200 && res.status != 201) {
        return false;
    }

    const body: any = res.data;
    if (!body) return true;

    return body.status == 200 || body.status == 201;
};

export const PLACE_BET_SUCCESS_MESSAGE =
    "Your place bet request received successfully";

export const buildPlaceBetSuccessTitle = (
    slipCount: number,
    hasLive: boolean,
    jackpot?: boolean
) => {
    if (jackpot) {
        return "Jackpot bet placed successfully";
    }

    let betType = "";
    if (hasLive) {
        betType += "Live";
    }
    betType += slipCount > 1 ? " Multibet" : " Single Bet";
    return `${betType} placed successfully`;
};

export const buildPlaceBetSuccessMessage = (
    _res?: ApiResponse,
    jackpot?: boolean
) => {
    if (jackpot) {
        return "Jackpot bet placed successfully.";
    }

    return PLACE_BET_SUCCESS_MESSAGE;
};

export const getDepositTopUpAmount = (stake: number, balance: number) => {
    const round = (value: number) => Math.ceil(value * 100) / 100;
    let amtDiff = round(stake) - round(balance);
    if (amtDiff < 5) {
        amtDiff = 5;
    }
    return amtDiff;
};
