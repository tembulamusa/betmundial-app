import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
    message?: string;
}

const NoEvents: React.FC<Props> = ({ message }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>
                {message
                    ? message
                    : "Sorry, no events found for your current selection."}
            </Text>
        </View>
    );
};

export default React.memo(NoEvents);

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginVertical: 20,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111",
    },
    text: {
        color: "#ccc",
        fontSize: 14,
        textAlign: "center",
    },
});