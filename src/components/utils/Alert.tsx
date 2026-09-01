import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface AlertProps {
    message?: {
        status?: number;
        message?: string;
    } | null;
    onDismiss?: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, onDismiss }) => {
    const [visibleMessage, setVisibleMessage] = useState(message);

    useEffect(() => {
        setVisibleMessage(message);
    }, [message]);

    if (visibleMessage?.status == null) return null;

    const isSuccess = [200, 201].includes(visibleMessage.status);
    const backgroundColor = isSuccess ? "#469866" : "rgba(176, 0, 32, 0.92)";

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Text style={styles.message}>{visibleMessage.message}</Text>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                    setVisibleMessage(undefined);
                    onDismiss?.();
                }}
            >
                <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
        </View>
    );
};

export default React.memo(Alert);

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderRadius: 6,
        marginVertical: 5,
        marginHorizontal: 10,
    },
    message: {
        color: "#fff",
        flex: 1,
        fontSize: 16,
    },
    closeButton: {
        paddingHorizontal: 8,
    },
    closeText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
});
