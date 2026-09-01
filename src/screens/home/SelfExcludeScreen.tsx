import React, { useContext, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";

import Alert from "../../components/utils/Alert";
import { getItem } from "../../components/utils/local-storage";
import { logoutUser } from "../../components/utils/logout";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { theme } from "../../theme";

type MessageType = {
    status: number;
    message: string;
};

const EXCLUSION_PERIODS = [
    { label: "1 month", value: "1" },
    { label: "3 months", value: "3" },
    { label: "6 months", value: "6" },
    { label: "1 year", value: "12" },
    { label: "Indefinitely", value: "-1" },
] as const;

const SelfExcludeScreen = () => {
    const [state, dispatch] = useContext(Context);
    const user = state?.user || getItem("user");
    const navigation = useNavigation<any>();

    const [period, setPeriod] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<MessageType | null>(null);
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);

    const selectedPeriodLabel = useMemo(() => {
        return EXCLUSION_PERIODS.find((item) => item.value === period)?.label;
    }, [period]);

    const handleExclusion = async () => {
        if (!period) {
            setMessage({
                status: 400,
                message: "Please select an exclusion period",
            });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await makeRequest({
                url: "/user/self-exclude",
                method: "POST",
                data: {
                    msisdn: user?.msisdn,
                    period,
                },
                apiVersion: 2,
            });

            if ([200, 201].includes(response?.status)) {
                setMessage({
                    status: 200,
                    message: "Self exclusion activated successfully",
                });

                setTimeout(() => {
                    logoutUser({ dispatch, navigation });
                }, 3000);
                return;
            }

            const body: any = response?.data;
            setMessage({
                status: response?.status || 400,
                message:
                    response?.error ||
                    body?.error?.message ||
                    (typeof body?.error === "string" ? body.error : null) ||
                    body?.message ||
                    "Something went wrong",
            });
        } catch {
            setMessage({
                status: 500,
                message: "Server error. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectPeriod = (value: string) => {
        setPeriod(value);
        setShowPeriodPicker(false);
        setMessage(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Self Exclusion</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                {message ? (
                    <Alert
                        message={message}
                        onDismiss={() => setMessage(null)}
                    />
                ) : null}

                <Text style={styles.description}>
                    This self-exclusion page provides you with the option to take a
                    break from gambling activities for a specific period of time.
                </Text>

                <View style={styles.phoneRow}>
                    <Text style={styles.label}>Your phone number:</Text>
                    <Text style={styles.phone}>{user?.msisdn}</Text>
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Select period of exclusion:</Text>

                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => setShowPeriodPicker(true)}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.selectText,
                                !selectedPeriodLabel && styles.selectPlaceholder,
                            ]}
                        >
                            {selectedPeriodLabel || "Select a period"}
                        </Text>
                        <Icon name="keyboard-arrow-down" size={24} color="rgba(255,255,255,0.75)" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleExclusion}
                    disabled={isLoading}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Exclude me from betting</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={showPeriodPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPeriodPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowPeriodPicker(false)}
                >
                    <Pressable style={styles.modalCard} onPress={() => undefined}>
                        <Text style={styles.modalTitle}>Select period of exclusion</Text>

                        {EXCLUSION_PERIODS.map((item) => {
                            const isSelected = period === item.value;

                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[
                                        styles.optionRow,
                                        isSelected && styles.optionRowSelected,
                                    ]}
                                    onPress={() => handleSelectPeriod(item.value)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {isSelected ? (
                                        <Icon name="check" size={20} color={theme.accent} />
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default SelfExcludeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: theme.pageHeaderBackground,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
    },
    headerSpacer: {
        width: 28,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 32,
    },
    description: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 28,
    },
    phoneRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        marginBottom: 24,
    },
    label: {
        color: "#fff",
        fontSize: 16,
    },
    phone: {
        color: "#2ecc71",
        marginLeft: 8,
        fontWeight: "700",
        fontSize: 16,
    },
    fieldGroup: {
        marginBottom: 8,
    },
    fieldLabel: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
        textAlign: "center",
    },
    selectInput: {
        minHeight: 52,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    selectText: {
        color: "#fff",
        fontSize: 16,
        flex: 1,
        paddingRight: 8,
    },
    selectPlaceholder: {
        color: "rgba(255,255,255,0.55)",
    },
    button: {
        marginTop: 36,
        backgroundColor: "#e11d48",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 56,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
        textTransform: "uppercase",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: "#101b25",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        paddingVertical: 8,
    },
    modalTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
    },
    optionRowSelected: {
        backgroundColor: "rgba(167,31,102,0.12)",
    },
    optionText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 16,
    },
    optionTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },
});
