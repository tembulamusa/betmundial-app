import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface AlertProps {
    message?: {
        status?: number;
        message?: string;
    };
}

const Alert: React.FC<AlertProps> = ({ message }) => {
    const [visibleMessage, setVisibleMessage] = useState(message);

    if (!visibleMessage?.status) return null;

    // Determine style based on status
    const backgroundColor =
        [200, 201].includes(visibleMessage.status) ? "#28a745" : "#dc3545"; // green or red

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Text style={styles.message}>{visibleMessage.message}</Text>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setVisibleMessage(undefined)}
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