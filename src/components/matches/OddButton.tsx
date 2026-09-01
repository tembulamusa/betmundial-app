import React, {
    useMemo,
    useCallback,
    useState,
    useEffect,
    memo,
} from "react";

import {
    TouchableOpacity,
    Text,
    StyleSheet,
} from "react-native";

import {
    applyAddToSlip,
    applyRemoveFromSlip,
    applyAddToJackpotSlip,
    applyRemoveFromJackpotSlip,
    persistBetslipSnapshot,
    persistJackpotBetslipSnapshot,
} from "../utils/betslip";

import { useAppDispatch } from "../../context/store";
import {
    betslipStore,
    commitBetslipUpdate,
    useSlipEntry,
} from "../../stores/betslipStore";

interface Props {
    match: any;
    mkt?: string;
    detail?: boolean;
    live?: boolean;
    jackpot?: boolean;
    marketKey?: string;
}

const clean = (str: string) =>
    str.replace(/[^A-Za-z0-9\-]/g, "").replace(/-+/g, "-");

const buildUcn = (match: any, mkt?: string, marketKey?: string) =>
    clean(
        String(match?.match_id ?? "") +
        String(match?.odds?.sub_type_id ?? match?.sub_type_id ?? "") +
        String(match?.[mkt || ""] ?? match?.odd_key ?? mkt ?? "draw") +
        (marketKey !== undefined ? String(marketKey) : "")
    );

const OddButton: React.FC<Props> = ({
    match,
    mkt,
    live,
    jackpot,
    marketKey,
}) => {
    const dispatch = useAppDispatch();
    const [pressedPicked, setPressedPicked] = useState<boolean | null>(null);

    const betslipKey = jackpot ? "jackpotbetslip" : "betslip";
    const matchId = String(match?.match_id ?? "");
    const ucn = useMemo(() => buildUcn(match, mkt, marketKey), [match, mkt, marketKey]);
    const oddValue = match?.odd_value ?? null;
    const specialBetValue = match?.special_bet_value || "";

    const slipEntry = useSlipEntry(matchId, jackpot);

    const isPickedFromSlip = useMemo(() => {
        if (!slipEntry) return false;
        return (
            slipEntry.ucn === ucn &&
            String(slipEntry.special_bet_value ?? "") === String(specialBetValue)
        );
    }, [slipEntry, ucn, specialBetValue]);

    useEffect(() => {
        setPressedPicked(null);
    }, [isPickedFromSlip]);

    const isPicked =
        pressedPicked !== null ? pressedPicked : isPickedFromSlip;

    const handlePress = useCallback(() => {
        const mid = match.match_id;
        const currentSlip = betslipStore.getSlip(jackpot);
        const removing = isPickedFromSlip;

        setPressedPicked(!removing);

        if (removing) {
            const nextSlip = jackpot
                ? applyRemoveFromJackpotSlip(currentSlip, mid)
                : applyRemoveFromSlip(currentSlip, mid);

            commitBetslipUpdate(dispatch, betslipKey, nextSlip);

            if (jackpot) {
                persistJackpotBetslipSnapshot(nextSlip);
            } else {
                persistBetslipSnapshot(nextSlip);
            }
            return;
        }

        const slip = {
            match_id: mid,
            parent_match_id: match.parent_match_id,
            special_bet_value: specialBetValue,
            sub_type_id: match.sub_type_id,
            bet_pick: match.odd_key,
            odd_value: oddValue,
            home_team: match.home_team,
            away_team: match.away_team,
            bet_type: live ? 1 : 0,
            odd_type: match?.name || match?.market_name,
            sport_name: match.sport_name,
            live: live ? 1 : 0,
            ucn,
            event_status: match?.status,
            market_active: match?.market_active,
            start_time: match?.start_time,
            producer_id: match?.producer_id,
        };

        const nextSlip = jackpot
            ? applyAddToJackpotSlip(currentSlip, slip)
            : applyAddToSlip(currentSlip, slip);

        commitBetslipUpdate(dispatch, betslipKey, nextSlip);

        if (jackpot) {
            persistJackpotBetslipSnapshot(nextSlip);
        } else {
            persistBetslipSnapshot(nextSlip);
        }
    }, [
        betslipKey,
        dispatch,
        isPickedFromSlip,
        jackpot,
        live,
        match,
        oddValue,
        specialBetValue,
        ucn,
    ]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={[styles.button, isPicked && styles.picked]}
        >
            <Text style={styles.label}>{match.odd_key}</Text>
            <Text style={styles.value}>
                {oddValue ? Number(oddValue).toFixed(2) : "-"}
            </Text>
        </TouchableOpacity>
    );
};

export default memo(OddButton);

const styles = StyleSheet.create({
    button: {
        flex: 1,
        minHeight: 40,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 6,
        paddingVertical: 4,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 2,
        paddingHorizontal: 4,
    },
    picked: {
        backgroundColor: "#a71f66",
    },
    label: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    value: {
        color: "#ffcc00",
        fontSize: 14,
        fontWeight: "700",
    },
});
