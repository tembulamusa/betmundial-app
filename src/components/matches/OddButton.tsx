import React, {
    useContext,
    useEffect,
    useState,
    useLayoutEffect,
    useCallback,
} from "react";

import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
} from "react-native";

import {
    addToSlip,
    removeFromSlip,
    addToJackpotSlip,
    removeFromJackpotSlip,
} from "../utils/betslip";

import { Context } from "../../context/store";

interface Props {
    match: any;
    mkt?: string;
    detail?: boolean;
    live?: boolean;
    jackpot?: boolean;
    marketKey?: string;
}

const OddButton: React.FC<Props> = ({
    match,
    mkt,
    detail,
    live,
    jackpot,
    marketKey,
}) => {

    const [ucn, setUcn] = useState("");
    const [picked, setPicked] = useState("");
    const [oddValue, setOddValue] = useState<number | null>(null);
    const [betslipKey, setBetslipKey] = useState("betslip");

    const [state, dispatch] = useContext(Context);

    const reference = match.match_id + "_selected";

    /* CLEAN STRING */

    const clean = (str: string) => {
        return str.replace(/[^A-Za-z0-9\-]/g, "").replace(/-+/g, "-");
    };

    /* JACKPOT SWITCH */

    const updateBetslipKey = useCallback(() => {
        if (jackpot) {
            setBetslipKey("jackpotbetslip");
        }
    }, [jackpot]);

    useEffect(() => {
        updateBetslipKey();
    }, [updateBetslipKey]);

    /* SET ODD VALUE */

    const updateOddValue = useCallback(() => {

        if (!match) return;

        const uc = clean(
            match.match_id +
            "" +
            (match?.odds?.sub_type_id || match?.sub_type_id) +
            (match?.[mkt || ""] || match?.odd_key || mkt || "draw")
        );

        setUcn(uc);
        setOddValue(match?.odd_value);

    }, [match, mkt]);

    useLayoutEffect(() => {
        updateOddValue();
    }, [updateOddValue]);

    /* UPDATE PICKED STATE */

    const updatePickedChoices = () => {

        const betslip = state?.[betslipKey];

        const uc = clean(
            match.match_id +
            "" +
            (match?.odds?.sub_type_id || match?.sub_type_id) +
            (match?.[mkt || ""] || match?.odd_key || mkt)
        );

        if (
            betslip?.[match.match_id]?.match_id == match.match_id &&
            uc == betslip?.[match.match_id]?.ucn &&
            betslip?.[match.match_id]?.special_bet_value ==
            match?.special_bet_value
        ) {
            setPicked("picked");
        } else {
            setPicked("");
        }
    };

    useEffect(() => {
        updatePickedChoices();
    }, [
        state?.[betslipKey]?.[match?.match_id],
        state?.betslip?.[match?.match_id],
    ]);

    useEffect(() => {
        updatePickedChoices();
    }, []);

    /* MATCH PICKED */

    const updateMatchPicked = useCallback(() => {

        if (state?.[reference]) {

            if (state?.[reference].startsWith("remove.")) {
                setPicked("");
            } else {

                const uc = clean(
                    match.match_id +
                    "" +
                    (match?.odds?.sub_type_id || match?.sub_type_id) +
                    (match?.[mkt || ""] || match?.odd_key || mkt)
                );

                if (state?.[reference] == uc + match?.special_bet_value) {
                    setPicked("picked");
                } else {
                    setPicked("");
                }
            }
        }

    }, [state?.[betslipKey]?.[match.match_id]]);

    useEffect(() => {
        updateMatchPicked();
    }, [updateMatchPicked]);

    /* BUTTON CLICK */

    const handlePress = () => {

        const mid = match.match_id;
        const pmid = match.parent_match_id;
        const stid = match.sub_type_id;
        const sbv = match.special_bet_value || "";
        const oddk = match.odd_key;

        const cstm = clean(
            mid +
            "" +
            stid +
            oddk +
            (marketKey !== undefined ? marketKey : "")
        );

        const slip = {
            match_id: mid,
            parent_match_id: pmid,
            special_bet_value: sbv,
            sub_type_id: stid,
            bet_pick: oddk,
            odd_value: oddValue,
            home_team: match.home_team,
            away_team: match.away_team,
            bet_type: live ? 1 : 0,
            odd_type: match?.name || match?.market_name,
            sport_name: match.sport_name,
            live: live ? 1 : 0,
            ucn: cstm,
            event_status: match?.status,
            market_active: match?.market_active,
            start_time: match?.start_time,
            producer_id: match?.producer_id,
        };

        if (cstm == ucn) {

            let betslip;

            if (picked === "picked") {

                setPicked("");

                betslip =
                    jackpot !== true
                        ? removeFromSlip(mid)
                        : removeFromJackpotSlip(mid);

                dispatch({
                    type: "SET",
                    key: reference,
                    payload: "remove." + cstm + sbv,
                });

            } else {

                betslip =
                    jackpot !== true
                        ? addToSlip(slip)
                        : addToJackpotSlip(slip);

                dispatch({
                    type: "SET",
                    key: reference,
                    payload: cstm + sbv,
                });
            }

            dispatch({
                type: "SET",
                key: betslipKey,
                payload: betslip,
            });

        }
    };

    /* UI */

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={[
                styles.button,
                picked === "picked" && styles.picked,
            ]}
        >
            {!detail && (
                <Text
                    style={[
                        styles.value,
                        picked === "picked" && styles.pickedText,
                    ]}
                >
                    {oddValue ? Number(oddValue).toFixed(2) : "-"}
                </Text>
            )}

            {detail && (
                <>
                    <Text
                        style={[
                            styles.label,
                            picked === "picked" && styles.pickedText,
                        ]}
                    >
                        {match.odd_key}
                    </Text>

                    <Text
                        style={[
                            styles.value,
                            picked === "picked" && styles.pickedText,
                        ]}
                    >
                        {Number(match?.odd_value).toFixed(2)}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default OddButton;

const styles = StyleSheet.create({

    button: {
        backgroundColor: "#1f1f1f",
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: "center",
        minWidth: 60,
    },

    picked: {
        backgroundColor: "#ffcc00",
    },

    pickedText: {
        color: "#000",
        fontWeight: "700",
    },

    label: {
        fontSize: 11,
        color: "#bbb",
    },

    value: {
        fontSize: 14,
        color: "#fff",
        fontWeight: "700",
    },
});