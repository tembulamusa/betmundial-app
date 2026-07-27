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
import { getItem } from "../../components/utils/local-storage";
import { makeRequest } from "../../components/utils/makeRequest";
import { isValidKenyanPhoneNumber, normalizeKenyanPhoneNumber } from "../../components/utils/phone";
import { Context } from "../../context/store";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const mpesa = require("../../assets/images/mpesa.png");

const DepositScreen = () => {
    const [state, dispatch] = useContext(Context);

    const app_name = "mobile-app";
    const promoName = state?.promoInfo;
    const app = promoName ? `${app_name}:${promoName}` : app_name;

    const user = state?.user || getItem("user") || null;
    const [isLoading, setIsLoading] = useState(false);

    const initialValues = {
        amount: "",
        msisdn: user?.msisdn || ""
    };

    const validate = (values: any) => {
        let errors: any = {};

        if (!isValidKenyanPhoneNumber(values.msisdn)) {
            errors.msisdn = "Invalid phone number";
        }

        if (!values.amount || values.amount < 1 || values.amount > 70000) {
            errors.amount = "Amount must be between KES 1 and 70,000";
        }

        return errors;
    };

    const handleSubmit = async (values: any) => {
        setIsLoading(true);

        const requestData = {
            ...values,
            msisdn: normalizeKenyanPhoneNumber(values.msisdn),
            app_name: app
        };

        try {
            const response = await makeRequest({
                url: "v2/deposits/stk/new",
                method: "POST",
                data: requestData,
                apiVersion: 3
            });
            // Alert.alert("Processing Deposit", JSON.stringify(response));
            dispatch({
                type: "SET",
                key: "toggleuserbalance",
                payload: state?.toggleuserbalance
                    ? !state?.toggleuserbalance
                    : true
            });
            if (response?.status === 200 || response?.status === 201) {
                Alert.alert(
                    "Deposit Started",
                    "Check your phone and enter M-Pesa PIN to complete deposit"
                );

                const pollBalID = setInterval(() => {
                    dispatch({
                        type: "SET",
                        key: "toggleuserbalance",
                        payload: state?.toggleuserbalance
                            ? !state?.toggleuserbalance
                            : true
                    });
                }, 7000);

                setTimeout(() => {
                    clearInterval(pollBalID);
                }, 60000);
            } else {
                // Alert.alert(
                //     "Deposit Failed",
                //     "STK Push not available. Please use Paybill deposit."
                // );
            }
        } catch (err) {
            Alert.alert("Error", "Error making deposit. Contact support.");
        }

        setIsLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Deposit Funds (Mobile Money)</Text>
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>

                <Image source={mpesa} style={styles.logo} />
                <Formik
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                    validate={validate}
                >

                    {({ values, errors, handleChange, handleSubmit }) => (
                        <>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={values.msisdn}
                                editable={false}
                            />

                            <Text style={styles.label}>Amount</Text>

                            <TextInput
                                style={styles.input}
                                value={values.amount}
                                onChangeText={handleChange("amount")}
                                keyboardType="numeric"
                                placeholder="Enter Amount"
                                placeholderTextColor="#ccc"
                            />

                            {errors.amount && (
                                <Text style={styles.error}>{errors.amount}</Text>
                            )}

                            <TouchableOpacity
                                style={styles.depositButton}
                                onPress={() => handleSubmit()}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.depositText}>Deposit</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </Formik>

                <View style={styles.instructions}>
                    <Text style={styles.instructionsTitle}>Direct Mpesa Deposit</Text>

                    <Text style={styles.instructionsText}>1. Go to Mpesa</Text>
                    <Text style={styles.instructionsText}>2. Select Lipa na Mpesa</Text>
                    <Text style={styles.instructionsText}>3. Paybill Number: 444142</Text>
                    <Text style={styles.instructionsText}>4. Account Number: Your phone number</Text>
                    <Text style={styles.instructionsText}>5. Enter Amount</Text>
                    <Text style={styles.instructionsText}>6. Enter PIN and confirm</Text>
                </View>

                <TouchableOpacity
                    style={styles.missingDeposit}
                    onPress={() =>
                        dispatch({
                            type: "SET",
                            key: "showcheckmpesadepositstatus",
                            payload: true
                        })
                    }
                >
                    <Text style={styles.missingText}>
                        Missing Deposit? Check Deposit Status
                    </Text>
                </TouchableOpacity>
            </View >
        </ScrollView >
    );
};

export default DepositScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // padding: 20,
        backgroundColor: "#0c0c24"
    },

    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 8,
        paddingVertical: 12,
        borderRadius: 2
    },

    logo: {
        width: 120,
        height: 60,
        alignSelf: "center",
        marginBottom: 20,
        resizeMode: "contain"
    },

    label: {
        color: "#ccc",
        marginBottom: 5
    },

    input: {
        backgroundColor: "#1a1a2e",
        borderRadius: 8,
        padding: 12,
        color: "#fff",
        marginBottom: 15
    },

    error: {
        color: "#ff4d4d",
        marginBottom: 10
    },

    depositButton: {
        backgroundColor: "#a71f66",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10
    },

    depositText: {
        color: "#fff",
        fontWeight: "bold"
    },

    instructions: {
        marginTop: 30,
        backgroundColor: "#151525",
        padding: 15,
        borderRadius: 10,
        color: "#fff"
    },
    instructionsText: {
        color: "#ccc",
        marginBottom: 5
    },

    instructionsTitle: {
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 10
    },

    missingDeposit: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#222",
        borderRadius: 8,
        alignItems: "center"
    },

    missingText: {
        color: "#38bdf8",
        fontWeight: "bold"
    }
});
