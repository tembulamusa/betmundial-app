import React, { memo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../theme";

interface HeaderLoginProps {
    onLoginPress?: () => void;
}

/** Guest header — mirrors web top-login.js: Login + Register only */
const HeaderLogin: React.FC<HeaderLoginProps> = ({ onLoginPress }) => {
    const navigation: any = useNavigation();

    const handleLogin = useCallback(() => {
        onLoginPress?.();
    }, [onLoginPress]);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.registerButton}
                onPress={() =>
                    navigation.navigate("Sports", { screen: "RegisterScreen" })
                }
                activeOpacity={0.85}
            >
                <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
};

export default memo(HeaderLogin);

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        flex: 1,
        gap: 8,
    },
    loginButton: {
        backgroundColor: theme.accent,
        minHeight: 32,
        minWidth: 76,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    loginText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 11,
        textTransform: "uppercase",
    },
    registerButton: {
        backgroundColor: "transparent",
        minHeight: 32,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    registerText: {
        color: theme.accent,
        fontWeight: "700",
        fontSize: 11,
        textTransform: "uppercase",
    },
});
