import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Formik } from "formik";

const ConfirmMpesaStatus = () => {
    const [isLoading, setIsLoading] = useState(false);

    const initialValues = { mpesaMessage: "" };

    const validate = (values: any) => {
        let errors: any = {};
        if (!values.mpesaMessage || values.mpesaMessage.trim().length === 0) {
            errors.mpesaMessage = "Please paste your MPESA message";
        }
        return errors;
    };

    const handleSubmit = async (values: any) => {
        setIsLoading(true);
        try {
            // Replace this with your actual API request
            // Example:
            // const [status, response] = await makeRequest({ url: 'v2/deposits/check', method: 'POST', data: values });

            setTimeout(() => {
                Alert.alert(
                    "Deposit Status",
                    "This is a placeholder. You can now implement API logic."
                );
                setIsLoading(false);
            }, 1000);
        } catch (err) {
            Alert.alert("Error", "Unable to check deposit status.");
            setIsLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
        >
            <Text style={styles.title}>Check Deposit Status</Text>

            <Text style={styles.instructions}>
                Need to check if your deposit has reflected? Copy the MPESA message
                you received and paste it below.
            </Text>

            <Formik
                initialValues={initialValues}
                validate={validate}
                onSubmit={handleSubmit}
            >
                {({ handleChange, handleSubmit, values, errors }) => (
                    <View style={{ marginTop: 20 }}>
                        <Text style={styles.label}>MPESA Message</Text>
                        <TextInput
                            style={styles.textArea}
                            value={values.mpesaMessage}
                            onChangeText={handleChange("mpesaMessage")}
                            placeholder="Paste your MPESA message here"
                            placeholderTextColor="#777"
                            multiline
                            numberOfLines={5}
                        />
                        {errors.mpesaMessage && (
                            <Text style={styles.error}>{errors.mpesaMessage}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={() => handleSubmit()}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>Check Now</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Formik>
        </ScrollView>
    );
};

export default ConfirmMpesaStatus;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0c0c24",
        padding: 20,
    },
    scrollContent: {
        paddingBottom: 50,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
    },
    instructions: {
        fontSize: 14,
        color: "#d1d5db",
        textAlign: "center",
        marginBottom: 20,
    },
    label: {
        color: "#9ca3af",
        marginBottom: 6,
        fontSize: 13,
    },
    textArea: {
        backgroundColor: "#16163a",
        borderRadius: 10,
        padding: 14,
        color: "#fff",
        borderWidth: 1,
        borderColor: "#27274a",
        textAlignVertical: "top",
        fontSize: 14,
        marginBottom: 10,
    },
    error: {
        color: "#ff5c5c",
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: "#a71f66",
        padding: 16,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    submitText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
});