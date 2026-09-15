import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from "react-native";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { getItem, setItem, normalizeUser } from "../../components/utils/local-storage";
import { normalizeKenyanPhoneNumber } from "../../components/utils/phone";
import { startOtpCapture } from "../../services/otpCapture";
import { getOrCreateDeviceId } from "../../services/deviceId";
import { theme } from "../../theme";

/** Survives remounts / Strict Mode so we never auto-spam the same number. */
const autoOtpRequestedForMsisdn = new Set<string>();

export default function VerifyAccountScreen({ navigation }: any) {
    const [state, dispatch] = useContext(Context);
    const [code, setCode] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string>("");
    const submittingRef = useRef(false);
    const sendingOtpRef = useRef(false);
    const capturedRef = useRef(false);
    const deviceIdRef = useRef("");
    const msisdn = state?.regmsisdn || "";
    const password = state?.regpassword || state?.loginmodalprefill?.password || "";

    useEffect(() => {
        deviceIdRef.current = deviceId;
    }, [deviceId]);

    const sendOTP = useCallback(async () => {
        if (!msisdn) {
            setError("Missing phone number. Please register again.");
            return;
        }
        if (sendingOtpRef.current) return;
        sendingOtpRef.current = true;
        setIsSendingOtp(true);
        setError(null);

        try {
            const id = deviceIdRef.current || (await getOrCreateDeviceId());
            if (!deviceIdRef.current) {
                deviceIdRef.current = id;
                setDeviceId(id);
            }

            const response = await makeRequest({
                url: "/auth/verification-code",
                method: "POST",
                apiVersion: 2,
                data: {
                    msisdn,
                    channel: "sms",
                    device_id: id,
                },
            });
            const body: any = response.data;
            if (
                [200, 201].includes(response.status) &&
                (body?.status == 200 || body?.status == 201)
            ) {
                setMessage("Verification code sent to your phone (SMS)");
            } else {
                setError(
                    body?.error?.message ||
                        body?.message ||
                        response.error ||
                        "Error fetching code"
                );
            }
        } finally {
            sendingOtpRef.current = false;
            setIsSendingOtp(false);
        }
    }, [msisdn]);

    const sendOTPRef = useRef(sendOTP);
    sendOTPRef.current = sendOTP;

    const autoLogin = useCallback(async () => {
        if (!msisdn || !password) {
            dispatch({
                type: "SET",
                key: "loginmodalprefill",
                payload: { mobile: msisdn, password: "", autoLogin: false },
            });
            dispatch({
                type: "SET",
                key: "loginmodalmessage",
                payload: "Account verified. Please login to continue.",
            });
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
            navigation.navigate("HomeMain");
            return;
        }

        const response = await makeRequest({
            url: "/auth/login",
            method: "POST",
            apiVersion: 2,
            data: {
                msisdn: normalizeKenyanPhoneNumber(msisdn),
                password,
            },
        });

        const body: any = response.data;
        if (
            [200, 201].includes(response.status) &&
            (body?.status == 200 || body?.status == 201)
        ) {
            const payload = body?.data || body;
            if (payload && (payload.access_token || payload.token)) {
                const user = normalizeUser(payload);
                await setItem("user", user);
                dispatch({ type: "SET", key: "user", payload: user });
                dispatch({ type: "DEL", key: "regpassword" });
                dispatch({ type: "DEL", key: "loginmodalprefill" });
                navigation.navigate("HomeMain");
                return;
            }
        }

        dispatch({
            type: "SET",
            key: "loginmodalprefill",
            payload: { mobile: msisdn, password, autoLogin: true },
        });
        dispatch({
            type: "SET",
            key: "loginmodalmessage",
            payload: "Account verified. Logging you in...",
        });
        dispatch({ type: "SET", key: "showloginmodal", payload: true });
        navigation.navigate("HomeMain");
    }, [dispatch, msisdn, navigation, password]);

    const handleVerify = useCallback(
        async (otpOverride?: string) => {
            const otp = (otpOverride ?? code).trim();
            if (submittingRef.current) return;
            if (!msisdn) {
                setError("Missing phone number. Please register again.");
                return;
            }
            if (!otp || otp.length < 4) {
                setError("Please enter four or more characters for code");
                return;
            }

            submittingRef.current = true;
            setIsLoading(true);
            setError(null);

            const response = await makeRequest({
                url: "/auth/verify",
                method: "POST",
                apiVersion: 2,
                data: { msisdn, code: otp },
            });

            const body: any = response.data;
            if (
                [200, 201].includes(response.status) &&
                (body?.status == 200 || body?.status == 201)
            ) {
                setMessage("Account verified successfully");
                await autoLogin();
            } else {
                setError(
                    body?.error?.message ||
                        body?.message ||
                        response.error ||
                        "Code invalid"
                );
                capturedRef.current = false;
            }

            setIsLoading(false);
            submittingRef.current = false;
        },
        [autoLogin, code, msisdn]
    );

    const onOtpCaptured = useCallback(
        (otp: string) => {
            if (capturedRef.current || submittingRef.current) return;
            capturedRef.current = true;
            setCode(otp);
            setOtpHint("OTP auto-filled from BetMundial SMS");
            void handleVerify(otp);
        },
        [handleVerify]
    );

    useEffect(() => {
        if (!msisdn) {
            (async () => {
                const cached = await getItem("regmsisdn");
                if (cached) {
                    dispatch({ type: "SET", key: "regmsisdn", payload: cached });
                }
            })();
        }
    }, [dispatch, msisdn]);

    // Auto-request OTP exactly once per phone number for this app session.
    useEffect(() => {
        if (!msisdn) return;
        if (autoOtpRequestedForMsisdn.has(msisdn)) return;
        autoOtpRequestedForMsisdn.add(msisdn);
        void sendOTPRef.current();
    }, [msisdn]);

    // SMS OTP autofill only
    useEffect(() => {
        let stop: (() => void) | undefined;
        let cancelled = false;
        capturedRef.current = false;

        (async () => {
            stop = await startOtpCapture(
                (otp) => {
                    if (cancelled) return;
                    onOtpCaptured(otp);
                },
                { channel: "sms" }
            );
        })();

        return () => {
            cancelled = true;
            stop?.();
        };
    }, [onOtpCaptured]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.card}>
                <Text style={styles.title}>Verify your account</Text>
                <Text style={styles.subtitle}>
                    Enter the one-time code we sent to your phone to finish creating your
                    account.
                </Text>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={msisdn}
                        editable={false}
                        placeholder="Phone number"
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.label}>
                        Code (OTP){" "}
                        <Text style={styles.sentBadge}>Sent via SMS</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={setCode}
                        placeholder="Enter Code"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        maxLength={8}
                    />
                </View>

                {otpHint ? <Text style={styles.hint}>{otpHint}</Text> : null}
                {message ? <Text style={styles.success}>{message}</Text> : null}
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.resendRow}>
                    <Text style={styles.resendText}>Didn't receive code?</Text>
                    <TouchableOpacity onPress={() => void sendOTP()} disabled={isSendingOtp}>
                        <Text style={styles.resendLink}>
                            {isSendingOtp ? "Sending..." : "Click to resend code"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => void handleVerify()}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Verify Account</Text>
                    )}
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
        marginBottom: 10,
    },
    subtitle: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 18,
        lineHeight: 20,
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
    sentBadge: {
        color: "#fbbf24",
        fontStyle: "italic",
        fontSize: 12,
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
    },
    hint: {
        color: "#86efac",
        marginBottom: 8,
        textAlign: "center",
    },
    success: {
        color: "#86efac",
        marginBottom: 8,
        textAlign: "center",
    },
    error: {
        color: "#f87171",
        marginBottom: 8,
        textAlign: "center",
    },
    resendRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    resendText: {
        color: "rgba(255,255,255,0.8)",
    },
    resendLink: {
        color: "#22c55e",
        fontWeight: "700",
    },
    primaryButton: {
        backgroundColor: "#a71f66",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
