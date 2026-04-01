import React, {
    useState,
    useEffect,
    useContext,
    useCallback
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert
} from "react-native";

import { Context } from "../../context/store";

import {
    removeFromSlip,
    getBetslip,
    clearSlip,
    removeFromJackpotSlip,
    getJackpotBetslip,
    clearJackpotSlip,
    formatNumber
} from "../utils/betslip";

import { getItem, setItem } from "../utils/local-storage";
import { makeRequest } from "../utils/makeRequest";

interface Props {
    jackpot?: boolean;
    jackpotData?: any;
    bonusBet?: boolean;
}

const Float = (equation: number, precision = 4) => {
    return Math.ceil(equation * 10 ** precision) / 10 ** precision;
};

const BetslipSubmitForm: React.FC<Props> = ({
    jackpot,
    jackpotData
}) => {

    const [state, dispatch] = useContext(Context);

    const betslipkey = jackpot ? "jackpotbetslip" : "betslip";

    const [stake, setStake] = useState<number>(
        state?.mobilefooteramount || jackpotData?.bet_amount || 100
    );

    const [possibleWin, setPossibleWin] = useState(0);
    const [netWin, setNetWin] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [totalOdds, setTotalOdds] = useState(1);
    const [message, setMessage] = useState<any>(null);
    const [ipInfo, setIpInfo] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Load IP ---
    useEffect(() => {
        fetch("https://api64.ipify.org?format=json")
            .then(res => res.json())
            .then(data => setIpInfo(data.ip))
            .catch(() => setIpInfo(null));
    }, []);

    // --- Sync betslip from storage to state ---
    useEffect(() => {
        const loadBetslip = async () => {
            const storedSlip = jackpot
                ? await getJackpotBetslip()
                : await getBetslip();

            dispatch({
                type: "SET",
                key: betslipkey,
                payload: storedSlip || {}
            });
        };

        loadBetslip();
    }, [jackpot]);

    // --- Rebet ---
    const rebet = async () => {

        if (state?.jackpotrebetslip) {

            dispatch({
                type: "SET",
                key: "jackpotbetslip",
                payload: state?.jackpotrebetslip
            });

            await setItem("jackpotbetslip", state?.jackpotrebetslip);

            dispatch({ type: "DEL", key: "jackpotrebetslip" });

        } else {

            dispatch({
                type: "SET",
                key: "betslip",
                payload: state?.rebetslip
            });

            await setItem("betslip", state?.rebetslip);

            dispatch({ type: "DEL", key: "rebetslip" });
        }
    };

    // --- Calculate winnings ---
    const updateWinnings = useCallback(() => {

        const slips = Object.values(state?.[betslipkey] || {});

        const odds = slips.reduce(
            (prev: number, item: any) => prev * (item?.odd_value || 1),
            1
        );

        setTotalOdds(odds);

        let rawWin = Float(stake * odds);

        if (jackpot) rawWin = jackpotData?.jackpot_amount;

        if (rawWin > 500000 && !jackpot) rawWin = 500000;

        setPossibleWin(Float(rawWin, 2));
        setNetWin(Float(rawWin, 2));

    }, [state?.[betslipkey], stake]);

    useEffect(() => {
        updateWinnings();
    }, [updateWinnings]);

    // --- Remove all ---
    const handleRemoveAll = async () => {

        const betslips = state?.[betslipkey] || {};

        for (const match_id of Object.keys(betslips)) {
            jackpot
                ? await removeFromJackpotSlip(match_id)
                : await removeFromSlip(match_id);
        }

        // clear storage
        jackpot
            ? await clearJackpotSlip()
            : await clearSlip();

        // clear state
        dispatch({ type: "DEL", key: betslipkey });

        // 🔥 ensure UI updates immediately
        dispatch({
            type: "SET",
            key: betslipkey,
            payload: {}
        });
    };

    // --- Place bet ---
    const handlePlaceBet = async () => {
        setIsSubmitting(true);
        try {

            const user = await getItem("user");

            if (!user) {
                setMessage({ status: 400, message: "Login required" });
                return;
            }

            const bs: any[] = Object.values(state?.[betslipkey] || {});

            if (!bs.length) {
                setMessage({ status: 400, message: "No bet selected" });
                return;
            }

            let slipHasOddsChange = false;
            let slipHasUnbettableEvents = false;

            const cleanedSlip = bs.map((slip: any) => {

                if (slip.disable === true) slipHasUnbettableEvents = true;

                if (slip.prev_odds && slip.prev_odds !== slip.odd_value) {
                    slipHasOddsChange = true;
                }

                const {
                    start_time,
                    disable,
                    comment,
                    prev_odds,
                    changeOrigin,
                    event_status,
                    ...rest
                } = slip;

                return rest;
            });

            if (slipHasUnbettableEvents || slipHasOddsChange) {
                let msg = "";
                if (slipHasUnbettableEvents) msg += "Some events are disabled.\n";
                if (slipHasOddsChange) msg += "Odds have changed.\n";

                setMessage({ status: 400, message: msg });
                return;
            }

            const payload = {
                bet_string: "mobile",
                app_name: "mobile",
                possible_win: possibleWin,
                stake_amount: stake,
                amount: stake,
                bet_total_odds: Float(totalOdds, 2),
                ip_address: ipInfo,
                slip: cleanedSlip,
                profile_id: user?.profile_id,
                msisdn: user?.msisdn,
                accept_all_odds_change: 1,
                bet_type: "3"
            };

            const endpoint = jackpot
                ? "/user/jackpot/place-bet"
                : "/user/place-bet";

            const res = await makeRequest({
                url: endpoint,
                method: "POST",
                data: payload,
                apiVersion: 2
            });
            // Alert.alert("Response", JSON.stringify(res));
            if (res?.status === 200 || res?.status === 201) {

                if (res?.data?.status === 200) {
                    dispatch({
                        type: "SET",
                        key: jackpot ? "jackpotrebetslip" : "rebetslip",
                        payload: state?.[betslipkey]
                    });

                    // clear storage properly
                    jackpot
                        ? await clearJackpotSlip()
                        : await clearSlip();

                    dispatch({ type: "DEL", key: betslipkey });

                    setMessage({
                        status: 200,
                        message: "Your place bet request received successfully"
                    });

                } else {
                    setMessage({
                        status: 400,
                        message: res?.data?.message || res?.data?.result || "Error placing bet"
                    });
                }

            } else {
                setMessage({
                    status: 400,
                    message: res?.error || "Error placing bet"
                });
            }

        } catch (err: any) {
            setMessage({
                status: 500,
                message: err?.message || "Something went wrong"
            });
        } finally {
            setIsSubmitting(false);
        }

    };

    return (
        <ScrollView style={styles.container}>

            {message?.status && (
                <View style={[
                    styles.alert,
                    message.status === 200 ? styles.success : styles.error
                ]}>

                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setMessage(null)}
                    >
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>

                    <Text style={styles.alertText}>
                        {message.message}
                    </Text>

                    {message.status === 200 && (
                        <TouchableOpacity
                            style={styles.rebetBtn}
                            onPress={rebet}
                        >
                            <Text style={styles.btnText}>REBET</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={styles.row}>
                <Text style={styles.label}>TOTAL ODDS</Text>
                <Text style={styles.value}>{totalOdds.toFixed(2)}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>AMOUNT (KSH)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={stake.toString()}
                    onChangeText={(text) =>
                        setStake(parseInt(text || "0"))
                    }
                />
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Bonus</Text>
                <Text style={styles.value}>
                    KES {formatNumber(bonus || 0)}
                </Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Possible Win</Text>
                <Text style={styles.value}>
                    KSH {formatNumber(netWin + bonus)}
                </Text>
            </View>

            <View style={styles.buttons}>
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={handleRemoveAll}
                >
                    <Text style={styles.btnText}>REMOVE ALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.placeBtn}
                    onPress={handlePlaceBet}
                    disabled={Object.keys(state?.[betslipkey] || {}).length === 0 || stake <= 10 || isSubmitting}
                >
                    <Text style={styles.btnText}>{isSubmitting ? "WAIT..." : "PLACE BET"}</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
};

export default React.memo(BetslipSubmitForm);

const styles = StyleSheet.create({
    container: {
        padding: 15,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 8
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15
    },
    label: { color: "#aaa" },
    value: { color: "#fff", fontWeight: "bold" },
    input: {
        borderWidth: 1,
        borderColor: "#333",
        padding: 8,
        width: 100,
        color: "#fff",
        textAlign: "right"
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    removeBtn: {
        backgroundColor: "#444",
        padding: 12,
        borderRadius: 6
    },
    placeBtn: {
        backgroundColor: "#e70654",
        padding: 12,
        borderRadius: 6
    },
    btnText: {
        color: "#fff",
        fontWeight: "bold"
    },
    alert: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 10
    },
    success: { backgroundColor: "#1b5e20" },
    error: { backgroundColor: "#b71c1c" },
    alertText: { color: "#fff", marginBottom: 10 },
    rebetBtn: {
        backgroundColor: "#e70654",
        padding: 10,
        borderRadius: 6,
        alignItems: "center"
    },
    closeBtn: {
        position: "absolute",
        right: 10,
        top: 5
    },
    closeText: {
        color: "#fff",
        fontSize: 18
    }
});