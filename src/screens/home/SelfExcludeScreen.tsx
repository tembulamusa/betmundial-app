import React, { useContext, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

import { getItem } from "../../components/utils/local-storage";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";

type MessageType = {
    status: number;
    message: string;
};

const SelfExcludeScreen = () => {
    const [state] = useContext(Context);
    const user = state?.user || getItem("user");

    const navigation = useNavigation();

    const [period, setPeriod] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<MessageType | null>(null);

    const handleExclusion = async () => {
        if (!period) {
            setMessage({
                status: 400,
                message: "Please select an exclusion period",
            });
            return;
        }

        const endpoint = "user/self-exclude";

        const payload = {
            msisdn: user?.msisdn,
            period: period,
        };

        setIsLoading(true);

        try {
            const response = await makeRequest({
                url: endpoint,
                method: "POST",
                data: payload,
                apiVersion: 2,
            });

            if ([200, 201].includes(response?.status)) {
                Alert.alert(
                    "Exclusion Successful",
                    "You have been self-excluded successfully. You will be logged out now."
                );

                setMessage(null);

                setTimeout(() => {
                    navigation.navigate("Logout" as never);
                }, 3000);
            } else {
                Alert.alert(
                    "Exclusion Failed",
                    response?.message || "Error processing self-exclusion request"
                );
            }
        } catch (error) {
            Alert.alert(
                "Exclusion Failed",
                "Server error. Please try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}

            <View style={styles.header}>
                <Text style={styles.headerText}>Self Exclusion</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>
                    This self-exclusion page allows you to take a break from gambling
                    activities for a specific period of time.
                </Text>

                {/* Phone number */}

                <View style={styles.phoneRow}>
                    <Text style={styles.label}>Your phone number:</Text>
                    <Text style={styles.phone}>{user?.msisdn}</Text>
                </View>

                {/* Period Picker */}

                <View style={styles.pickerContainer}>
                    <Text style={styles.label}>Select period of exclusion</Text>

                    <Picker
                        selectedValue={period}
                        onValueChange={(value) => setPeriod(value)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select a period" value="" />
                        <Picker.Item label="1 month" value="1" />
                        <Picker.Item label="3 months" value="3" />
                        <Picker.Item label="6 months" value="6" />
                        <Picker.Item label="1 year" value="12" />
                        <Picker.Item label="Indefinitely" value="-1" />
                    </Picker>
                </View>

                {/* Button */}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleExclusion}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Exclude me from betting</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SelfExcludeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
    },

    header: {
        backgroundColor: "#613354",
        padding: 18,
        alignItems: "center",
    },

    headerText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
    },

    content: {
        padding: 20,
    },

    description: {
        color: "#ccc",
        marginBottom: 30,
    },

    phoneRow: {
        flexDirection: "row",
        marginBottom: 20,
    },

    label: {
        color: "white",
        fontSize: 16,
    },

    phone: {
        color: "#2ecc71",
        marginLeft: 10,
        fontWeight: "bold",
    },

    pickerContainer: {
        backgroundColor: "#1e293b",
        borderRadius: 8,
        marginTop: 10,
    },

    picker: {
        color: "white",
    },

    button: {
        marginTop: 40,
        backgroundColor: "#e11d48",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "white",
        fontWeight: "bold",
        textTransform: "uppercase",
    },
});