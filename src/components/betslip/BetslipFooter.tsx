import React, { useContext, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Context } from "../../context/store";
import { formatNumber } from "../utils/betslip";
import { Float } from "./betslipCalculations";

const BetslipFooter: React.FC = () => {
    const [state, dispatch] = useContext(Context);

    const isJackpot = Boolean(state?.isjackpot);
    const slipCount = useMemo(
        () =>
            Object.keys(
                isJackpot ? state?.jackpotbetslip || {} : state?.betslip || {}
            ).length,
        [isJackpot, state?.betslip, state?.jackpotbetslip]
    );

    const visible = slipCount > 0 && !state?.showmobileslip;

    const stakeValue = String(state?.mobilefooteramount ?? 100);

    const onStakeChange = useCallback(
        (text: string) => {
            if (!/^\d*$/.test(text)) return;
            dispatch({
                type: "SET",
                key: "mobilefooteramount",
                payload: text === "" ? "" : parseInt(text, 10),
            });
        },
        [dispatch]
    );

    const openSlip = useCallback(() => {
        dispatch({ type: "SET", key: "showmobileslip", payload: true });
    }, [dispatch]);

    if (!visible) {
        return null;
    }

    return (
        <View style={styles.wrapper}>
            <View style={styles.row}>
                <TouchableOpacity style={styles.slipBtn} onPress={openSlip} activeOpacity={0.85}>
                    <Text style={styles.slipLabel}>Slip</Text>
                    <View style={styles.counter}>
                        <Text style={styles.counterText}>{slipCount}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.stakeWrap}>
                    {isJackpot ? (
                        <Text style={styles.metaText}>
                            Stake: {state?.jackpotdata?.bet_amount ?? "-"}
                        </Text>
                    ) : (
                        <TextInput
                            style={styles.stakeInput}
                            keyboardType="number-pad"
                            value={stakeValue}
                            onChangeText={onStakeChange}
                            placeholder="100"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            selectTextOnFocus
                        />
                    )}
                </View>

                <View style={styles.summary}>
                    {!isJackpot && (
                        <Text style={styles.metaText}>
                            Odds:{" "}
                            <Text style={styles.metaValue}>
                                {Float(Number(state?.totalodds) || 1, 2).toFixed(2)}
                            </Text>
                        </Text>
                    )}
                    <Text style={styles.metaText}>
                        Win:{" "}
                        <Text style={styles.metaValue}>
                            {isJackpot
                                ? formatNumber(state?.jackpotdata?.jackpot_amount || 0)
                                : formatNumber(state?.slipnetwin || 0)}
                        </Text>
                    </Text>
                </View>

                <TouchableOpacity style={styles.betNowBtn} onPress={openSlip} activeOpacity={0.85}>
                    <Text style={styles.betNowText}>Bet Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default React.memo(BetslipFooter);

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: "rgba(0, 12, 36, 0.96)",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    slipBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fbd702",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 8,
        minWidth: 72,
    },
    slipLabel: {
        color: "#101b25",
        fontWeight: "700",
        fontSize: 12,
        textTransform: "capitalize",
        marginRight: 6,
    },
    counter: {
        backgroundColor: "#e70654",
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    counterText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 11,
    },
    stakeWrap: {
        flex: 0.9,
        justifyContent: "center",
    },
    stakeInput: {
        height: 28,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
        borderRadius: 6,
        backgroundColor: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
        paddingHorizontal: 6,
        paddingVertical: 0,
        textAlign: "center",
    },
    summary: {
        flex: 1.1,
        justifyContent: "center",
    },
    metaText: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 11,
        marginBottom: 2,
    },
    metaValue: {
        color: "#fff",
        fontWeight: "700",
    },
    betNowBtn: {
        backgroundColor: "#e70654",
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 10,
        minWidth: 72,
        alignItems: "center",
        justifyContent: "center",
    },
    betNowText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 11,
        textTransform: "uppercase",
    },
});
