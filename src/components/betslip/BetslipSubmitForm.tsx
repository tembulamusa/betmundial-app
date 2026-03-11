import React, { useState, useEffect, useContext, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView
} from "react-native";

import { Context } from "../../context/store";

import {
    removeFromSlip,
    getBetslip,
    clearSlip,
    removeFromJackpotSlip,
    addToJackpotSlip,
    getJackpotBetslip,
    clearJackpotSlip,
    formatNumber
} from "../utils/betslip";

import { getItem, setItem, removeItem } from "../utils/local-storage";
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
    jackpotData,
    bonusBet
}) => {

    const [state, dispatch] = useContext(Context);

    const [stake, setStake] = useState<number>(
        state?.mobilefooteramount || jackpotData?.bet_amount || 100
    );

    const [possibleWin, setPossibleWin] = useState(0);
    const [netWin, setNetWin] = useState(0);
    const [bonus, setBonus] = useState(0);
    const [totalOdds, setTotalOdds] = useState(1);
    const [message, setMessage] = useState<any>(null);

    const [betslipkey, setBetslipKey] = useState(
        jackpot ? "jackpotbetslip" : "betslip"
    );

    const [ipInfo, setIpInfo] = useState<any>(null);

    const [dbWinMatrix, setDbWinMatrix] = useState<any>({});

    useEffect(() => {
        fetch("https://api64.ipify.org?format=json")
            .then(res => res.json())
            .then(data => setIpInfo(data.ip))
            .catch(() => setIpInfo(null));
    }, []);

    const updateWinnings = useCallback(() => {

        if (!state?.[betslipkey]) return;

        const slips = Object.values(state?.[betslipkey] || {});

        const odds = slips.reduce(
            (prev: number, item: any) => prev * item?.odd_value,
            1
        );

        setTotalOdds(odds);

        let rawWin = Float(stake * odds);

        if (jackpot) rawWin = jackpotData?.jackpot_amount;

        if (rawWin > 500000 && !jackpot) rawWin = 500000;

        setPossibleWin(Float(rawWin, 2));
        setNetWin(Float(rawWin, 2));

        dispatch({
            type: "SET",
            key: "totalodds",
            payload: Float(odds)
        });

    }, [state?.[betslipkey], stake]);

    useEffect(() => {
        updateWinnings();
    }, [updateWinnings]);

    const handleRemoveAll = () => {

        const betslips = state?.isjackpot
            ? getJackpotBetslip()
            : getBetslip();

        if (!betslips) return;

        Object.entries(betslips).forEach(([match_id]) => {
            state?.isjackpot
                ? removeFromJackpotSlip(match_id)
                : removeFromSlip(match_id);
        });

        state?.isjackpot ? clearJackpotSlip() : clearSlip();

        dispatch({
            type: "DEL",
            key: state?.isjackpot ? "jackpotbetslip" : "betslip"
        });
    };

    const handlePlaceBet = async () => {

        const user = getItem("user");

        if (!user) {
            Alert.alert("Login required");
            return;
        }

        const bs = Object.values(state?.[betslipkey] || []);

        if (!bs.length) {
            Alert.alert("No bet selected");
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
            slip: bs,
            profile_id: user?.profile_id,
            msisdn: user?.msisdn
        };

        const endpoint = jackpot
            ? "/user/jackpot/place-bet"
            : "/user/place-bet";

        const [status, response] = await makeRequest({
            url: endpoint,
            method: "POST",
            data: payload,
            api_version: 2
        });

        if (status === 200 || status === 201) {

            Alert.alert("Success", "Bet placed successfully");

            dispatch({
                type: "SET",
                key: "rebetslip",
                payload: state?.betslip
            });

            clearSlip();

            dispatch({ type: "DEL", key: betslipkey });

        } else {

            Alert.alert(
                "Bet Error",
                response?.message || "Error placing bet"
            );

        }

    };

    return (

        <ScrollView style={styles.container}>

            {message && (
                <View style={styles.alert}>
                    <Text>{message.message}</Text>
                </View>
            )}

            {!jackpot && (
                <View style={styles.row}>
                    <Text style={styles.label}>TOTAL ODDS</Text>
                    <Text style={styles.value}>
                        {parseFloat(totalOdds.toString()).toFixed(2)}
                    </Text>
                </View>
            )}

            <View style={styles.row}>
                <Text style={styles.label}>AMOUNT (KSH)</Text>

                {jackpot ? (
                    <Text>{jackpotData?.bet_amount}</Text>
                ) : (
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={stake.toString()}
                        onChangeText={(text) => {
                            const value = parseInt(text || "0");
                            setStake(value);
                        }}
                    />
                )}
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
                >
                    <Text style={styles.btnText}>PLACE BET</Text>
                </TouchableOpacity>

            </View>

        </ScrollView>
    );
};

export default React.memo(BetslipSubmitForm);

const styles = StyleSheet.create({

    container: {
        padding: 15
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15
    },

    label: {
        color: "#aaa",
        fontSize: 14
    },

    value: {
        color: "#fff",
        fontWeight: "bold"
    },

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
        justifyContent: "space-between",
        marginTop: 20
    },

    removeBtn: {
        backgroundColor: "#444",
        padding: 12,
        borderRadius: 6
    },

    placeBtn: {
        backgroundColor: "#00a651",
        padding: 12,
        borderRadius: 6
    },

    btnText: {
        color: "#fff",
        fontWeight: "bold"
    },

    alert: {
        padding: 10,
        backgroundColor: "#222",
        marginBottom: 10
    }

});