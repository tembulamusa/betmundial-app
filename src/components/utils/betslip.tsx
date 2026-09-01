import {
    getItem,
    setItem,
    removeItem
} from './local-storage';

type Slip = {
    match_id: string;
    bet_type?: number;
    ucn?: string;
    special_bet_value?: string;
    [key: string]: any;
};

type SlipMap = Record<string, Slip>;

let betslipPersistTimer: ReturnType<typeof setTimeout> | null = null;
let jackpotPersistTimer: ReturnType<typeof setTimeout> | null = null;

const schedulePersist = (key: "betslip" | "jackpotbetslip", slip: SlipMap) => {
    const timerRef = key === "betslip" ? betslipPersistTimer : jackpotPersistTimer;

    if (timerRef) {
        clearTimeout(timerRef);
    }

    const timer = setTimeout(() => {
        void setItem(key, slip);
    }, 400);

    if (key === "betslip") {
        betslipPersistTimer = timer;
    } else {
        jackpotPersistTimer = timer;
    }
};

export const applyAddToSlip = (current: SlipMap | null | undefined, entry: Slip): SlipMap => {
    return { ...(current || {}), [entry.match_id]: entry };
};

export const applyRemoveFromSlip = (
    current: SlipMap | null | undefined,
    match_id: string
): SlipMap => {
    const next = { ...(current || {}) };
    delete next[match_id];
    return next;
};

export const applyAddToJackpotSlip = (current: SlipMap | null | undefined, entry: Slip): SlipMap => {
    return { ...(current || {}), [entry.match_id]: entry };
};

export const applyRemoveFromJackpotSlip = (
    current: SlipMap | null | undefined,
    match_id: string
): SlipMap => {
    const next = { ...(current || {}) };
    delete next[match_id];
    return next;
};

export const persistBetslipSnapshot = (slip: SlipMap) => {
    schedulePersist("betslip", slip);
};

export const persistJackpotBetslipSnapshot = (slip: SlipMap) => {
    schedulePersist("jackpotbetslip", slip);
};

export const addToSlip = async (slip: Slip) => {
    const current_slip = (await getItem('betslip')) || {};
    return applyAddToSlip(current_slip, slip);
};

export const removeFromSlip = async (match_id: string) => {
    const slip = (await getBetslip()) || {};
    return applyRemoveFromSlip(slip, match_id);
};

export const clearSlip = async () => {
    await removeItem('betslip');
};

export const getBetslip = async () => {
    return await getItem('betslip');
};

export const getJackpotBetslip = async () => {
    return await getItem('jackpotbetslip');
};

export const addToJackpotSlip = async (slip: Slip) => {
    const current_slip = (await getItem('jackpotbetslip')) || {};
    return applyAddToJackpotSlip(current_slip, slip);
};

export const removeFromJackpotSlip = async (match_id: string) => {
    const current_slip = (await getItem('jackpotbetslip')) || {};
    return applyRemoveFromJackpotSlip(current_slip, match_id);
};

export const clearJackpotSlip = async () => {
    await removeItem('jackpotbetslip');
};

export const formatNumber = (number: number | undefined) => {
    return number == undefined || number == 0
        ? '0'
        : number
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            .replace(".00", '');
};
