import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import type { PlaceBetMessage } from "./placebetMessages";

interface Props {
    message?: PlaceBetMessage | null;
    onDismiss?: () => void;
    onRebet?: () => void;
}

const BetslipAlert: React.FC<Props> = ({ message, onDismiss, onRebet }) => {
    if (!message || message.status == null) {
        return null;
    }

    const isSuccess = message.status == 200 || message.status == 201;

    return (
        <View
            style={[
                styles.container,
                isSuccess ? styles.success : styles.error,
            ]}
        >
            <View style={styles.headerRow}>
                <Text style={styles.title}>
                    {message.title || (isSuccess ? "Success" : "Error!")}
                </Text>
                <TouchableOpacity
                    onPress={onDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={[styles.closeText, !isSuccess && styles.closeTextError]}>
                        ×
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.message}>{message.message}</Text>

            {isSuccess && onRebet && message.status == 200 ? (
                <TouchableOpacity style={styles.rebetBtn} onPress={onRebet}>
                    <Text style={styles.rebetText}>Rebet</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default React.memo(BetslipAlert);

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 0,
        marginTop: 4,
        marginBottom: 10,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
    },
    success: {
        backgroundColor: "#469866",
        borderColor: "rgba(11, 96, 28, 0.3)",
    },
    error: {
        backgroundColor: "rgba(176, 0, 32, 0.92)",
        borderColor: "rgba(255, 69, 0, 0.45)",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    closeText: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        lineHeight: 28,
    },
    closeTextError: {
        color: "orangered",
    },
    message: {
        color: "#fff",
        fontSize: 16,
        lineHeight: 22,
        fontWeight: "500",
    },
    rebetBtn: {
        marginTop: 12,
        alignSelf: "stretch",
        borderWidth: 1,
        borderColor: "#77B18E",
        borderRadius: 8,
        backgroundColor: "rgba(255, 255, 255, 0.32)",
        paddingVertical: 10,
        alignItems: "center",
    },
    rebetText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        textTransform: "uppercase",
    },
});
