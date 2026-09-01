import { useSyncExternalStore } from "react";

type SlipMap = Record<string, any>;

type BetslipKey = "betslip" | "jackpotbetslip";

type StoreState = {
    betslip: SlipMap;
    jackpotbetslip: SlipMap;
};

let state: StoreState = {
    betslip: {},
    jackpotbetslip: {},
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

export const betslipStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    getSlip(jackpot?: boolean) {
        return jackpot ? state.jackpotbetslip : state.betslip;
    },

    getEntry(matchId: string, jackpot?: boolean) {
        const slip = jackpot ? state.jackpotbetslip : state.betslip;
        return slip[matchId];
    },

    getCount(jackpot?: boolean) {
        const slip = jackpot ? state.jackpotbetslip : state.betslip;
        return Object.keys(slip).length;
    },

    set(key: BetslipKey, slip: SlipMap) {
        state = {
            ...state,
            [key]: slip,
        };
        emit();
    },

    hydrate(betslip: SlipMap, jackpotbetslip: SlipMap) {
        state = {
            betslip: betslip || {},
            jackpotbetslip: jackpotbetslip || {},
        };
        emit();
    },

    clear(key: BetslipKey) {
        betslipStore.set(key, {});
    },
};

export function useSlipEntry(matchId: string, jackpot?: boolean) {
    return useSyncExternalStore(
        betslipStore.subscribe,
        () => betslipStore.getEntry(matchId, jackpot),
        () => betslipStore.getEntry(matchId, jackpot)
    );
}

export function useBetslipCount(jackpot?: boolean) {
    return useSyncExternalStore(
        betslipStore.subscribe,
        () => betslipStore.getCount(jackpot),
        () => betslipStore.getCount(jackpot)
    );
}

export function commitBetslipUpdate(
    dispatch: (action: any) => void,
    key: BetslipKey,
    nextSlip: SlipMap
) {
    betslipStore.set(key, nextSlip);
    dispatch({ type: "SET", key, payload: nextSlip });
}
