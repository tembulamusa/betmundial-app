import React, { useContext, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert
} from "react-native";

import { Formik } from "formik";
import { Context } from "../../context/store";
import { getItem } from "../../components/utils/local-storage";
import { makeRequest } from "../../components/utils/makeRequest";
import { isValidKenyanPhoneNumber, normalizeKenyanPhoneNumber } from "../../components/utils/phone";

const mpesa = require("../../assets/images/mpesa.png");

const WithdrawScreen = () => {
    const [state, dispatch] = useContext(Context);

    const user = state?.user || getItem("user");

    const [isLoading, setIsLoading] = useState(false);

    const initialValues = {
        amount: "",
        msisdn: user?.msisdn || ""
    };

    const validate = (values: any) => {
        let errors: any = {};

        if (!isValidKenyanPhoneNumber(values.msisdn)) {
            errors.msisdn = "Please enter a valid phone number";
        }

        if (!values.amount || values.amount <= 0) {
            errors.amount = "Please enter a valid amount";
        }

        return errors;
    };

    const handleSubmit = async (values: any) => {
        setIsLoading(true);
        const normalizedMsisdn = normalizeKenyanPhoneNumber(values.msisdn);

        try {
            const response = await makeRequest({
                url: "v2/withdrawals/new",
                method: "POST",
                data: {
                    msisdn: normalizedMsisdn,
                    amount: values.amount
                },
                apiVersion: 3
            });
            if (response?.status == 200 || response?.status == 201) {
                Alert.alert(
                    "Withdrawal Request Sent",
                    "Your withdrawal request has been submitted successfully."
                );

                dispatch({
                    type: "SET",
                    key: "toggleuserbalance",
                    payload: !state?.toggleuserbalance
                });
            } else {
                Alert.alert(
                    "Withdrawal Failed",
                    response?.message ||
                    response?.data?.message ||
                    response?.error ||
                    "Error sending withdrawal request"
                );
            }
        } catch (err) {
            Alert.alert("Error", "Unable to process withdrawal.");
        }

        setIsLoading(false);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.title}>Withdraw Funds</Text>

            <Image source={mpesa} style={styles.logo} />

            <Formik
                initialValues={initialValues}
                validate={validate}
                onSubmit={handleSubmit}
            >
                {({ values, errors, handleChange, handleSubmit }) => (
                    <>
                        <Text style={styles.label}>Phone Number</Text>

                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={values.msisdn}
                            editable={false}
                        />

                        {errors.msisdn && (
                            <Text style={styles.error}>{errors.msisdn}</Text>
                        )}

                        <Text style={styles.label}>Amount to Withdraw</Text>

                        <TextInput
                            style={styles.input}
                            value={values.amount}
                            onChangeText={handleChange("amount")}
                            keyboardType="numeric"
                            placeholder="Enter amount"
                            placeholderTextColor="#777"
                        />

                        {errors.amount && (
                            <Text style={styles.error}>{errors.amount}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.withdrawButton}
                            onPress={() => handleSubmit()}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.withdrawText}>
                                    Withdraw Funds
                                </Text>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </Formik>

            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>
                    Withdrawal Instructions
                </Text>

                <Text style={styles.step}>
                    1. Enter the M-Pesa phone number to receive funds.
                </Text>
                <Text style={styles.step}>
                    2. Enter the amount you wish to withdraw.
                </Text>
                <Text style={styles.step}>
                    3. Click the withdraw button.
                </Text>
                <Text style={styles.step}>
                    4. Check your phone for M-Pesa confirmation.
                </Text>

                <View style={styles.divider} />

                <Text style={styles.instructionsTitle}>Withdraw via SMS</Text>

                <Text style={styles.step}>
                    Send <Text style={styles.bold}>w#amount</Text> or{" "}
                    <Text style={styles.bold}>withdraw#amount</Text>
                </Text>

                <Text style={styles.step}>
                    Example: Send <Text style={styles.bold}>w#500</Text> to{" "}
                    <Text style={styles.bold}>29488</Text>
                </Text>
            </View>
        </ScrollView>
    );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0c0c24"
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 80
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#ffffff",
        textAlign: "center",
        marginBottom: 20
    },

    logo: {
        width: 120,
        height: 60,
        alignSelf: "center",
        marginBottom: 30,
        resizeMode: "contain"
    },

    label: {
        color: "#9ca3af",
        marginBottom: 6,
        fontSize: 13
    },

    input: {
        backgroundColor: "#16163a",
        borderRadius: 10,
        padding: 14,
        color: "#fff",
        borderWidth: 1,
        borderColor: "#27274a",
        marginBottom: 15
    },

    disabledInput: {
        opacity: 0.7
    },

    error: {
        color: "#ff5c5c",
        marginBottom: 10
    },

    withdrawButton: {
        backgroundColor: "#a71f66",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10
    },

    withdrawText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15
    },

    instructions: {
        marginTop: 35,
        backgroundColor: "#151535",
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#24245c"
    },

    instructionsTitle: {
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 12,
        fontSize: 15
    },

    step: {
        color: "#d1d5db",
        marginBottom: 6,
        fontSize: 14
    },

    divider: {
        height: 1,
        backgroundColor: "#2c2c5c",
        marginVertical: 15
    },

    bold: {
        fontWeight: "700",
        color: "#fff"
    }
});
