import React, { useState, memo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

interface HeaderLoginProps {
    onLoginPress?: () => void;
}

const HeaderLogin: React.FC<HeaderLoginProps> = ({ onLoginPress }) => {
    const navigation: any = useNavigation();

    // ✅ LOCAL STATE (instead of global dispatch)
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleLogin = useCallback(() => {
        if (onLoginPress) {
            onLoginPress();
            return;
        }

        // ⚡ instant UI update (no global re-render)
        setShowLoginModal(true);
    }, [onLoginPress]);

    const closeModal = useCallback(() => {
        setShowLoginModal(false);
    }, []);

    return (
        <>
            <View style={styles.container}>
                {/* LOGIN */}
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>

                {/* REGISTER */}
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() =>
                        navigation.navigate("Sports", {
                            screen: "RegisterScreen",
                        })
                    }
                >
                    <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
            </View>

            {/* ✅ LOCAL MODAL */}
            <Modal visible={showLoginModal} transparent animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Login Required</Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                closeModal();
                                navigation.navigate("Sports", {
                                    screen: "LoginScreen",
                                });
                            }}
                        >
                            <Text style={styles.modalButtonText}>
                                Go to Login
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeModal}
                        >
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
};

export default memo(HeaderLogin);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingVertical: 4,
    },

    loginButton: {
        marginRight: 4,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },

    loginText: {
        color: "#fff",
        fontWeight: "500",
        textTransform: "uppercase",
    },

    registerButton: {
        backgroundColor: "#a71f66",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },

    registerText: {
        color: "#fff",
        fontWeight: "500",
        textTransform: "uppercase",
    },

    /* MODAL */
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalContent: {
        width: "85%",
        backgroundColor: "#0c0c24",
        padding: 20,
        borderRadius: 10,
    },

    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
    },

    modalButton: {
        backgroundColor: "#a71f66",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 10,
    },

    modalButtonText: {
        color: "#fff",
        fontWeight: "600",
    },

    closeButton: {
        padding: 10,
        alignItems: "center",
    },

    closeText: {
        color: "#aaa",
    },
});