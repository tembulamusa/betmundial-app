import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import makeRequest from "../utils/makeRequest";

const TestingScreen = () => {
    const [loading, setLoading] = useState(false);

    const testApi = async () => {
        try {
            setLoading(true);

            const [status, result] = await makeRequest({
                url: "test-endpoint",
                method: "GET",
            });

            Alert.alert(
                "API Result",
                `Status: ${status}\n\n${JSON.stringify(result, null, 2)}`
            );
        } catch (error) {
            Alert.alert("Error", "API test failed");
        } finally {
            setLoading(false);
        }
    };

    const testStorage = async () => {
        await AsyncStorage.setItem("testKey", "Hello Testing 🚀");
        const value = await AsyncStorage.getItem("testKey");

        Alert.alert("AsyncStorage", value || "No value found");
    };

    const clearStorage = async () => {
        await AsyncStorage.clear();
        Alert.alert("Storage", "All storage cleared");
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>🧪 Testing Panel</Text>

            <TouchableOpacity style={styles.button} onPress={testApi}>
                <Text style={styles.buttonText}>
                    {loading ? "Testing API..." : "Test API Call"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={testStorage}>
                <Text style={styles.buttonText}>Test AsyncStorage</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={clearStorage}>
                <Text style={styles.buttonText}>Clear Storage</Text>
            </TouchableOpacity>
            <Text style={{ color: "#fff", marginTop: 20, textAlign: "center" }}>
                Use this panel to test API calls and storage operations.
            </Text>
        </ScrollView>
    );
};

export default TestingScreen;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: "rgba(0, 12, 36, 1)",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 30,
    },
    button: {
        backgroundColor: "#1e88e5",
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    dangerButton: {
        backgroundColor: "#e53935",
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
    },
});