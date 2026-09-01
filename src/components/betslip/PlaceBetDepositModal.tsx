import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
} from "react-native";

import { Context } from "../../context/store";
import { makeRequest } from "../utils/makeRequest";
import { normalizeKenyanPhoneNumber } from "../utils/phone";
import { theme } from "../../theme";

const mpesa = require("../../assets/images/mpesa.png");

const PlaceBetDepositModal: React.FC = () => {
    const [state, dispatch] = useContext(Context);
    const prompt = state?.promptdepositrequest;

    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    const visible = Boolean(prompt?.show);
    const minAmount = prompt?.payableAmt ?? 5;

    useEffect(() => {
        if (visible) {
            setAmount(String(minAmount));
            setFeedback(
                typeof prompt?.message?.message === "string"
                    ? prompt.message.message
                    : null
            );
        }
    }, [visible, minAmount, prompt?.message?.message]);

    const closeModal = () => {
        dispatch({ type: "DEL", key: "promptdepositrequest" });
        setFeedback(null);
        setIsLoading(false);
    };

    const handleDeposit = async () => {
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount < minAmount || parsedAmount > 70000) {
            setFeedback(
                `Please enter amount between KES ${minAmount} and KES 70,000.00`
            );
            return;
        }

        const msisdn = state?.user?.msisdn;
        if (!msisdn) {
            closeModal();
            dispatch({ type: "DEL", key: "showloginmodal" });
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
            const response = await makeRequest({
                url: "v2/deposits/stk/new",
                method: "POST",
                data: {
                    amount: parsedAmount,
                    msisdn: normalizeKenyanPhoneNumber(msisdn),
                    app_name: "mobile-app",
                },
                apiVersion: 3,
            });

            if (response?.status === 200 || response?.status === 201) {
                dispatch({
                    type: "SET",
                    key: "toggleuserbalance",
                    payload: state?.toggleuserbalance
                        ? !state?.toggleuserbalance
                        : true,
                });
                Alert.alert(
                    "Deposit Started",
                    "Check your phone and enter M-Pesa PIN to complete deposit"
                );
                closeModal();
            } else {
                setFeedback("Error pushing STK. Please deposit directly.");
            }
        } catch {
            setFeedback("Error making deposit. Contact support.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={closeModal}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Insufficient Balance</Text>
                    <Image source={mpesa} style={styles.logo} />

                    {feedback ? (
                        <Text style={styles.feedback}>{feedback}</Text>
                    ) : null}

                    <Text style={styles.label}>Amount (KES)</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="Enter amount"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={styles.depositBtn}
                        onPress={handleDeposit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#111" />
                        ) : (
                            <Text style={styles.depositText}>Deposit</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                        <Text style={styles.cancelText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default React.memo(PlaceBetDepositModal);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        padding: 20,
    },
    card: {
        backgroundColor: "#0c0c24",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    closeBtn: {
        position: "absolute",
        right: 12,
        top: 8,
        zIndex: 2,
    },
    closeText: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        lineHeight: 28,
    },
    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
        textAlign: "center",
    },
    logo: {
        width: 100,
        height: 50,
        alignSelf: "center",
        marginBottom: 16,
        resizeMode: "contain",
    },
    feedback: {
        color: "#ffb4b4",
        marginBottom: 12,
        textAlign: "center",
        lineHeight: 20,
    },
    label: {
        color: "#ccc",
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#1a1a2e",
        borderRadius: 8,
        padding: 12,
        color: "#fff",
        marginBottom: 14,
    },
    depositBtn: {
        backgroundColor: theme.deposit,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    depositText: {
        color: "#111",
        fontWeight: "700",
    },
    cancelBtn: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 8,
    },
    cancelText: {
        color: "#ccc",
        fontWeight: "600",
    },
});
