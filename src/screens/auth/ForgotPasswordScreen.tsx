import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from "react-native";
import { Formik } from "formik";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { isValidKenyanPhoneNumber, normalizeKenyanPhoneNumber } from "../../components/utils/phone";
import { theme } from "../../theme";

export default function ForgotPasswordScreen({ navigation }: any) {
    const [, dispatch] = useContext(Context);
    const [otpSent, setOtpSent] = useState(false);
    const [msisdn, setMsisdn] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch({ type: "DEL", key: "showloginmodal" });
    }, [dispatch]);

    const requestOtp = async (values: { msisdn: string }) => {
        setLoading(true);
        setError(null);
        setMessage(null);
        const normalized = normalizeKenyanPhoneNumber(values.msisdn);
        const response = await makeRequest({
            url: "/auth/forgot-password",
            method: "POST",
            apiVersion: 2,
            data: { msisdn: normalized },
        });
        const body: any = response.data;
        if (response.status == 200 && body?.status == 200) {
            setMsisdn(normalized);
            setOtpSent(true);
            setMessage("Verification Code sent to your phone number");
        } else {
            setError(body?.result || body?.message || response.error || "Unable to process");
        }
        setLoading(false);
    };

    const resetPassword = async (values: {
        verificationCode: string;
        password: string;
        repeat_password: string;
    }) => {
        setLoading(true);
        setError(null);
        setMessage(null);
        const response = await makeRequest({
            url: "/auth/reset-password",
            method: "POST",
            apiVersion: 2,
            data: {
                msisdn,
                verification_code: values.verificationCode,
                password: values.password,
            },
        });
        const body: any = response.data;
        if (
            [200, 201].includes(response.status) &&
            (body?.status == 200 || body?.status == 201)
        ) {
            setMessage("Password reset successfully. Login to continue");
            dispatch({
                type: "SET",
                key: "loginmodalprefill",
                payload: { mobile: msisdn, password: values.password, autoLogin: false },
            });
            dispatch({
                type: "SET",
                key: "loginmodalmessage",
                payload: "Password reset successfully. Login to continue",
            });
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
            navigation.navigate("HomeMain");
        } else {
            setError("Error occurred. Wrong or stale code used.");
        }
        setLoading(false);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.card}>
                <Text style={styles.title}>Forgot Password</Text>

                {message ? <Text style={styles.success}>{message}</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                {!otpSent ? (
                    <Formik
                        initialValues={{ msisdn: "" }}
                        validate={(values) => {
                            const errors: any = {};
                            if (!isValidKenyanPhoneNumber(values.msisdn)) {
                                errors.msisdn = "Please enter a valid phone number";
                            }
                            return errors;
                        }}
                        onSubmit={requestOtp}
                        validateOnChange={false}
                        validateOnBlur={false}
                    >
                        {({ values, errors, handleChange, handleSubmit }) => (
                            <>
                                <Text style={styles.label}>Your Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={values.msisdn}
                                    onChangeText={handleChange("msisdn")}
                                    placeholder="Phone number"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                />
                                {errors.msisdn ? (
                                    <Text style={styles.error}>{errors.msisdn}</Text>
                                ) : null}
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => handleSubmit()}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Send OTP</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </Formik>
                ) : (
                    <Formik
                        initialValues={{
                            verificationCode: "",
                            password: "",
                            repeat_password: "",
                        }}
                        validate={(values) => {
                            const errors: any = {};
                            if (!values.verificationCode) {
                                errors.verificationCode = "Please enter your One Time Pin (OTP)";
                            } else if (values.verificationCode.length < 4) {
                                errors.verificationCode =
                                    "Your OTP should be greater than 4 numbers.";
                            }
                            if (!values.password) {
                                errors.password = "Please enter your new password";
                            }
                            if (!values.repeat_password) {
                                errors.repeat_password = "Please enter your password confirmation";
                            } else if (values.password !== values.repeat_password) {
                                errors.repeat_password = "The passwords do not match.";
                            }
                            return errors;
                        }}
                        onSubmit={resetPassword}
                        validateOnChange={false}
                        validateOnBlur={false}
                    >
                        {({ values, errors, handleChange, handleSubmit }) => (
                            <>
                                <Text style={styles.label}>Mobile</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={msisdn}
                                    editable={false}
                                />

                                <Text style={styles.label}>OTP</Text>
                                <TextInput
                                    style={styles.input}
                                    value={values.verificationCode}
                                    onChangeText={handleChange("verificationCode")}
                                    placeholder="OTP"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="number-pad"
                                />
                                {errors.verificationCode ? (
                                    <Text style={styles.error}>{errors.verificationCode}</Text>
                                ) : null}

                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={values.password}
                                    onChangeText={handleChange("password")}
                                    placeholder="Password"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                />
                                {errors.password ? (
                                    <Text style={styles.error}>{errors.password}</Text>
                                ) : null}

                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={values.repeat_password}
                                    onChangeText={handleChange("repeat_password")}
                                    placeholder="Password"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry
                                />
                                {errors.repeat_password ? (
                                    <Text style={styles.error}>{errors.repeat_password}</Text>
                                ) : null}

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => handleSubmit()}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>
                                            Reset Password
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </Formik>
                )}

                <TouchableOpacity
                    onPress={() => {
                        dispatch({ type: "SET", key: "showloginmodal", payload: true });
                        navigation.navigate("HomeMain");
                    }}
                >
                    <Text style={styles.loginLink}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    title: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },
    label: {
        color: "#fff",
        marginBottom: 8,
        marginTop: 10,
        fontSize: 14,
        fontWeight: "500",
    },
    input: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    inputDisabled: {
        opacity: 0.85,
        marginBottom: 8,
    },
    success: {
        color: "#86efac",
        textAlign: "center",
        marginBottom: 10,
    },
    error: {
        color: "#f87171",
        marginTop: 6,
        marginBottom: 6,
        fontSize: 12,
    },
    primaryButton: {
        backgroundColor: "#a71f66",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 18,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    loginLink: {
        color: "#a71f66",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 18,
        textAlign: "center",
    },
});
