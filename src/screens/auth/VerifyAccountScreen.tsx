import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    AppState,
    AppStateStatus,
    Modal,
    Pressable,
} from "react-native";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { getItem, setItem, normalizeUser } from "../../components/utils/local-storage";
import { normalizeKenyanPhoneNumber } from "../../components/utils/phone";
import { startOtpCapture, type OtpSource } from "../../services/otpCapture";
import {
    emitOtpChannelSelection,
    subscribeDeviceChannel,
    type OtpDeliveryChannel,
} from "../../services/otpDeviceSocket";
import { getOrCreateDeviceId } from "../../services/deviceId";
import { theme } from "../../theme";

const OTP_REFRESH_MS = 30 * 60 * 1000;

export default function VerifyAccountScreen({ navigation }: any) {
    const [state, dispatch] = useContext(Context);
    const [code, setCode] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [otpHint, setOtpHint] = useState<string | null>(null);
    const [otpChannel, setOtpChannel] = useState<OtpDeliveryChannel>("sms");
    const [showChannelPrompt, setShowChannelPrompt] = useState(false);
    const [deviceId, setDeviceId] = useState<string>("");
    const submittingRef = useRef(false);
    const capturedRef = useRef(false);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const otpChannelRef = useRef<OtpDeliveryChannel>("sms");
    const msisdn = state?.regmsisdn || "";
    const password = state?.regpassword || state?.loginmodalprefill?.password || "";

    useEffect(() => {
        otpChannelRef.current = otpChannel;
    }, [otpChannel]);

    const sendOTP = useCallback(
        async (channel: OtpDeliveryChannel = otpChannelRef.current) => {
            if (!msisdn) {
                setError("Missing phone number. Please register again.");
                return;
            }
            setIsSendingOtp(true);
            setError(null);

            const id = deviceId || (await getOrCreateDeviceId());
            if (!deviceId) setDeviceId(id);

            const response = await makeRequest({
                url: "/auth/verification-code",
                method: "POST",
                apiVersion: 2,
                data: {
                    msisdn,
                    channel,
                    device_id: id,
                },
            });
            const body: any = response.data;
            if (
                [200, 201].includes(response.status) &&
                (body?.status == 200 || body?.status == 201)
            ) {
                setMessage(
                    channel === "whatsapp"
                        ? "Verification code sent via WhatsApp"
                        : "Verification code sent to your phone (SMS)"
                );
            } else {
                setError(
                    body?.error?.message ||
                        body?.message ||
                        response.error ||
                        "Error fetching code"
                );
            }
            setIsSendingOtp(false);
        },
        [deviceId, msisdn]
    );

    const selectChannel = useCallback(
        async (channel: OtpDeliveryChannel) => {
            setOtpChannel(channel);
            otpChannelRef.current = channel;
            setShowChannelPrompt(false);
            capturedRef.current = false;

            const id = deviceId || (await getOrCreateDeviceId());
            if (!deviceId) setDeviceId(id);

            emitOtpChannelSelection({
                device_id: id,
                channel,
                msisdn,
            });

            await sendOTP(channel);
            setOtpHint(
                channel === "whatsapp"
                    ? "Listening for BetMundial WhatsApp OTP…"
                    : "Listening for BetMundial SMS OTP…"
            );
        },
        [deviceId, msisdn, sendOTP]
    );

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
        (otp: string, source: OtpSource) => {
            if (capturedRef.current || submittingRef.current) return;
            capturedRef.current = true;
            setCode(otp);
            const fromWhatsApp = source === "whatsapp" || source === "clipboard";
            setOtpHint(
                fromWhatsApp
                    ? "OTP auto-filled from BetMundial WhatsApp"
                    : "OTP auto-filled from BetMundial SMS"
            );
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

    useEffect(() => {
        void sendOTP("sms");
    }, [sendOTP]);

    useEffect(() => {
        const timer = setInterval(() => {
            void sendOTP(otpChannelRef.current);
        }, OTP_REFRESH_MS);
        return () => clearInterval(timer);
    }, [sendOTP]);

    useEffect(() => {
        const sub = AppState.addEventListener("change", (next) => {
            const wasBackground =
                appStateRef.current === "inactive" ||
                appStateRef.current === "background";
            if (wasBackground && next === "active") {
                void sendOTP(otpChannelRef.current);
            }
            appStateRef.current = next;
        });
        return () => sub.remove();
    }, [sendOTP]);

    // Device socket subscription — on message, offer WhatsApp channel switch
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        let cancelled = false;

        (async () => {
            const sub = await subscribeDeviceChannel((data) => {
                if (cancelled || !data) return;
                const wantsWhatsApp =
                    data.enable_whatsapp === true ||
                    data.whatsapp === true ||
                    data.channel === "whatsapp" ||
                    /whatsapp/i.test(String(data.type || data.message || ""));
                if (wantsWhatsApp || data) {
                    setShowChannelPrompt(true);
                }
            });
            if (cancelled) {
                sub.cleanup();
                return;
            }
            setDeviceId(sub.deviceId);
            cleanup = sub.cleanup;
        })();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, []);

    // Listen both SMS + WhatsApp for BetMundial OTP; first win
    useEffect(() => {
        let stop: (() => void) | undefined;
        let cancelled = false;
        capturedRef.current = false;

        (async () => {
            stop = await startOtpCapture(
                (otp, source) => {
                    if (cancelled) return;
                    onOtpCaptured(otp, source);
                },
                { channel: "both" }
            );
        })();

        return () => {
            cancelled = true;
            stop?.();
        };
    }, [onOtpCaptured, otpChannel]);

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

                <View style={styles.channelRow}>
                    <TouchableOpacity
                        style={[
                            styles.channelChip,
                            otpChannel === "sms" && styles.channelChipActive,
                        ]}
                        onPress={() => void selectChannel("sms")}
                    >
                        <Text
                            style={[
                                styles.channelChipText,
                                otpChannel === "sms" && styles.channelChipTextActive,
                            ]}
                        >
                            SMS
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.channelChip,
                            otpChannel === "whatsapp" && styles.channelChipActive,
                        ]}
                        onPress={() => void selectChannel("whatsapp")}
                    >
                        <Text
                            style={[
                                styles.channelChipText,
                                otpChannel === "whatsapp" && styles.channelChipTextActive,
                            ]}
                        >
                            WhatsApp
                        </Text>
                    </TouchableOpacity>
                </View>

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
                        <Text style={styles.sentBadge}>
                            {otpChannel === "whatsapp"
                                ? "Sent via WhatsApp"
                                : "Sent via SMS"}
                        </Text>
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
                    <TouchableOpacity
                        onPress={() => void sendOTP(otpChannel)}
                        disabled={isSendingOtp}
                    >
                        <Text style={styles.resendLink}>
                            {isSendingOtp ? "Sending..." : "Click Resend Code"}
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

            <Modal
                visible={showChannelPrompt}
                transparent
                animationType="fade"
                onRequestClose={() => setShowChannelPrompt(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowChannelPrompt(false)}
                >
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Choose verification channel</Text>
                        <Text style={styles.modalBody}>
                            You can receive your BetMundial OTP by SMS or WhatsApp. SMS is
                            selected by default.
                        </Text>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonPrimary]}
                            onPress={() => void selectChannel("whatsapp")}
                        >
                            <Text style={styles.modalButtonText}>Use WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => void selectChannel("sms")}
                        >
                            <Text style={styles.modalButtonTextSecondary}>Keep SMS</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
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
    channelRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 18,
        justifyContent: "center",
    },
    channelChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    channelChipActive: {
        backgroundColor: "#a71f66",
        borderColor: "#a71f66",
    },
    channelChipText: {
        color: "rgba(255,255,255,0.75)",
        fontWeight: "600",
    },
    channelChipTextActive: {
        color: "#fff",
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: "#0c0c24",
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },
    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
        textAlign: "center",
    },
    modalBody: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 18,
    },
    modalButton: {
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    modalButtonPrimary: {
        backgroundColor: "#25D366",
        borderColor: "#25D366",
    },
    modalButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    modalButtonTextSecondary: {
        color: "rgba(255,255,255,0.85)",
        fontWeight: "600",
        fontSize: 15,
    },
});
