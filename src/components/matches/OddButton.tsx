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

    const handlePress = async () => {

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
                        ? await removeFromSlip(mid)
                        : await removeFromJackpotSlip(mid);

                dispatch({
                    type: "SET",
                    key: reference,
                    payload: "remove." + cstm + sbv,
                });

            } else {

                betslip =
                    jackpot !== true
                        ? await addToSlip(slip)
                        : await addToJackpotSlip(slip);

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
            style={[styles.button, picked === "picked" && styles.picked]}
        >
            <Text style={styles.label}>
                {match.odd_key}
            </Text>

            <Text style={styles.value}>
                {oddValue ? Number(oddValue).toFixed(2) : "-"}
            </Text>
        </TouchableOpacity>
    );
};

export default OddButton;

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
