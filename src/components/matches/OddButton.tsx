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
    /** Compact listing style (home match cards) */
    listing?: boolean;
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

/** Mirrors web `getMobileOddLabel` for listing cards */
const getMobileOddLabel = (match: any, mkt?: string) => {
    const key = String(match?.odd_key || "").trim().toLowerCase();
    const outcomeId = String(match?.outcome_id ?? "").trim();
    const isThreeWay = !mkt || String(mkt).toLowerCase() === "1x2";
    const marketName = String(
        mkt || match?.name || match?.market_name || ""
    ).toLowerCase();
    const subTypeId = Number(match?.sub_type_id);

    if (isThreeWay) {
        if (key === "1" || key === "home" || outcomeId === "1") {
            return match?.home_team || match?.odd_key;
        }
        if (key === "x" || key === "draw" || outcomeId === "2") {
            return "DRAW";
        }
        if (key === "2" || key === "away" || outcomeId === "3") {
            return match?.away_team || match?.odd_key;
        }
    }

    if (
        subTypeId === 18 ||
        marketName.includes("total") ||
        marketName.includes("over")
    ) {
        const line = match?.special_bet_value || "2.5";
        const lineFmt = Number.isFinite(Number(line))
            ? Number(line).toFixed(2)
            : line;
        if (key.includes("over") || outcomeId === "12") return `OVER ${lineFmt}`;
        if (key.includes("under") || outcomeId === "13")
            return `UNDER ${lineFmt}`;
    }

    if (subTypeId === 10 || marketName.includes("double")) {
        if (key === "1x" || key === "1 or x") return "1 OR X";
        if (key === "x2" || key === "x or 2") return "X OR 2";
        if (key === "12" || key === "1 or 2") return "1 OR 2";
    }

    if (
        subTypeId === 29 ||
        marketName.includes("both") ||
        marketName.includes("gg")
    ) {
        if (
            key === "yes" ||
            key === "gg" ||
            key.includes("yes") ||
            outcomeId === "74"
        ) {
            return "YES (GG)";
        }
        if (
            key === "no" ||
            key === "ng" ||
            key.includes("no") ||
            outcomeId === "76"
        ) {
            return "NO (NG)";
        }
    }

    return match?.odd_key || "";
};

const OddButton: React.FC<Props> = ({
    match,
    mkt,
    detail,
    live,
    jackpot,
    marketKey,
    listing,
}) => {
    const dispatch = useAppDispatch();
    const [pressedPicked, setPressedPicked] = useState<boolean | null>(null);

    const betslipKey = jackpot ? "jackpotbetslip" : "betslip";
    const matchId = String(match?.match_id ?? "");
    const ucn = useMemo(
        () => buildUcn(match, mkt, marketKey),
        [match, mkt, marketKey]
    );
    const oddValue = match?.odd_value ?? null;
    const specialBetValue = match?.special_bet_value || "";

    const slipEntry = useSlipEntry(matchId, jackpot);

    const isPickedFromSlip = useMemo(() => {
        if (!slipEntry) return false;
        return (
            slipEntry.ucn === ucn &&
            String(slipEntry.special_bet_value ?? "") ===
                String(specialBetValue)
        );
    }, [slipEntry, ucn, specialBetValue]);

    useEffect(() => {
        setPressedPicked(null);
    }, [isPickedFromSlip]);

    const isPicked =
        pressedPicked !== null ? pressedPicked : isPickedFromSlip;

    const displayLabel = useMemo(() => {
        if (detail) {
            const key = match?.odd_key || "";
            const special = match?.special_bet_value;
            return special ? `${key} ${special}` : key;
        }
        return getMobileOddLabel(match, mkt);
    }, [detail, match, mkt]);

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
            style={[
                listing ? styles.listingButton : styles.button,
                isPicked && styles.picked,
            ]}
        >
            <Text
                style={[
                    listing ? styles.listingLabel : styles.label,
                    isPicked && styles.pickedText,
                ]}
                numberOfLines={1}
            >
                {displayLabel}
            </Text>
            <Text
                style={[
                    listing ? styles.listingValue : styles.value,
                    isPicked && styles.pickedText,
                ]}
            >
                {oddValue ? Number(oddValue).toFixed(2) : "-"}
            </Text>
        </TouchableOpacity>
    );
};

export default memo(OddButton);

const styles = StyleSheet.create({
    button: {
        flex: 1,
        minHeight: 48,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 4,
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 2,
        paddingHorizontal: 4,
    },
    listingButton: {
        flex: 1,
        minHeight: 40,
        backgroundColor: "rgba(255,255,255,0.25)",
        borderRadius: 0,
        paddingVertical: 4,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    picked: {
        backgroundColor: "#a71f66",
    },
    label: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 11,
        fontWeight: "500",
        textTransform: "uppercase",
        textAlign: "center",
    },
    listingLabel: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 10,
        fontWeight: "500",
        textTransform: "uppercase",
        textAlign: "center",
        lineHeight: 12,
        maxWidth: "100%",
    },
    value: {
        color: "#ffc428",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 2,
    },
    listingValue: {
        color: "#ffc428",
        fontSize: 15,
        fontWeight: "700",
        lineHeight: 18,
    },
    pickedText: {
        color: "#ffffff",
    },
});
