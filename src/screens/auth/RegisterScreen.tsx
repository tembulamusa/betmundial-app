import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Formik } from "formik";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { isValidKenyanPhoneNumber, normalizeKenyanPhoneNumber } from "../../components/utils/phone";
import { theme } from "../../theme";

export default function RegisterScreen({ navigation, route }: any) {
    const [state, dispatch] = useContext(Context);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const promoCodeFromRoute = route?.params?.promoCode || "";
    const promoName = state?.promoInfo;
    const appName = useMemo(() => {
        const base = "mobile-app";
        return promoName ? `${base}:${promoName}` : base;
    }, [promoName]);

    useEffect(() => {
        dispatch({ type: "DEL", key: "showloginmodal" });
    }, [dispatch]);

    const initialValues = {
        msisdn: "",
        password: "",
        password2: "",
        promo_code: promoCodeFromRoute,
    };

    const validate = (values: any) => {
        const errors: any = {};

        if (!isValidKenyanPhoneNumber(values.msisdn)) {
            errors.msisdn = "Please enter a valid phone number";
        }

        if (!values.password || values.password.length < 4) {
            errors.password = "Please enter four or more characters for password";
        }

        if (values.password2 !== values.password) {
            errors.password2 = "Passwords don't match";
        }

        return errors;
    };

    const submitRegistration = async (values: any) => {
        setLoading(true);
        setSubmitError(null);
        const normalizedMsisdn = normalizeKenyanPhoneNumber(values.msisdn);

        const response = await makeRequest({
            url: "/auth/signup",
            method: "POST",
            apiVersion: 2,
            data: {
                msisdn: normalizedMsisdn,
                password: values.password,
                promo_code: values.promo_code,
                app_name: appName,
            },
        });

        dispatch({
            type: "SET",
            key: "regmsisdn",
            payload: normalizedMsisdn,
        });

        if ([200, 201, 204].includes(response.status)) {
            dispatch({
                type: "SET",
                key: "loginmodalprefill",
                payload: {
                    mobile: normalizedMsisdn,
                    password: values.password,
                    autoLogin: true,
                },
            });
            dispatch({
                type: "SET",
                key: "loginmodalmessage",
                payload: "Registration successful. Logging you in...",
            });
            dispatch({
                type: "SET",
                key: "showloginmodal",
                payload: true,
            });
            navigation.navigate("HomeMain");
        } else {
            setSubmitError(response?.error || "Error making registration");
        }

        setLoading(false);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.card}>
                <Text style={styles.pageTitle}>Register</Text>
                <Text style={styles.headline}>Join betmundial</Text>
                <Text style={styles.subheadline}>
                    Home to the best odds, instant payouts and many bonuses
                </Text>

                <Formik
                    initialValues={initialValues}
                    onSubmit={submitRegistration}
                    validate={validate}
                    validateOnBlur={false}
                    validateOnChange={false}
                >
                    {({
                        values,
                        errors,
                        handleChange,
                        handleSubmit,
                    }) => (
                        <>
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <TextInput
                                    value={values.msisdn}
                                    style={styles.input}
                                    placeholder="Phone number"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    onChangeText={handleChange("msisdn")}
                                />
                                {errors.msisdn ? <Text style={styles.error}>{errors.msisdn}</Text> : null}
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        value={values.password}
                                        style={styles.passwordInput}
                                        placeholder="Password"
                                        placeholderTextColor="#94a3b8"
                                        secureTextEntry={!showPassword}
                                        onChangeText={handleChange("password")}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword((prev) => !prev)}
                                    >
                                        <Icon
                                            name={showPassword ? "visibility" : "visibility-off"}
                                            size={22}
                                            color="#cbd5e1"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Repeat Password</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        value={values.password2}
                                        style={styles.passwordInput}
                                        placeholder="Repeat password"
                                        placeholderTextColor="#94a3b8"
                                        secureTextEntry={!showPassword2}
                                        onChangeText={handleChange("password2")}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword2((prev) => !prev)}
                                    >
                                        <Icon
                                            name={showPassword2 ? "visibility" : "visibility-off"}
                                            size={22}
                                            color="#cbd5e1"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.password2 ? <Text style={styles.error}>{errors.password2}</Text> : null}
                            </View>

                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Promo Code</Text>
                                <TextInput
                                    value={values.promo_code}
                                    style={styles.input}
                                    placeholder="Promo Code"
                                    placeholderTextColor="#94a3b8"
                                    editable={!promoCodeFromRoute}
                                    onChangeText={handleChange("promo_code")}
                                />
                            </View>

                            {submitError ? (
                                <Text style={styles.submitError}>{submitError}</Text>
                            ) : null}

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => handleSubmit()}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Signup</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    dispatch({
                                        type: "SET",
                                        key: "showloginmodal",
                                        payload: true,
                                    });
                                }}
                            >
                                <Text style={styles.loginLink}>
                                    Have an account? Login here
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.disclaimer}>
                                <Text style={styles.disclaimerText}>
                                    By registering for an account, you agree to our Terms of Use,
                                    Privacy Policy and Responsible Gambling Policy.
                                </Text>
                                <Text style={styles.disclaimerText}>
                                    You must be 18yrs and above in order to sign up.
                                </Text>
                            </View>
                        </>
                    )}
                </Formik>
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
    pageTitle: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 24,
    },
    headline: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
        textAlign: "center",
    },
    subheadline: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
    },
    fieldGroup: {
        marginBottom: 18,
    },
    label: {
        color: "#fff",
        marginBottom: 8,
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
    passwordWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a2e",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 14,
    },
    passwordInput: {
        flex: 1,
        color: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    eyeButton: {
        paddingHorizontal: 14,
    },
    error: {
        color: "#f87171",
        marginTop: 6,
        fontSize: 12,
    },
    submitError: {
        color: "#f87171",
        textAlign: "center",
        marginBottom: 12,
    },
    primaryButton: {
        backgroundColor: "#a71f66",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 6,
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
    },
    disclaimer: {
        marginTop: 28,
    },
    disclaimerText: {
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 10,
    },
});
