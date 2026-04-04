import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch } from "../../context/store";

interface HeaderLoginProps {
    onLoginPress?: () => void;
}

const HeaderLogin: React.FC<HeaderLoginProps> = ({ onLoginPress }) => {
    const navigation: any = useNavigation();
    const dispatch = useAppDispatch();

    const handleLogin = () => {
        // if (onLoginPress) {
        //     onLoginPress();
        //     return;
        // }
        // Alert.alert("Login Required", "Please log in to access this feature.")
        dispatch({
            type: "SET",
            key: "showloginmodal",
            payload: true,
        });
    };

    return (
        <View style={styles.container}>
            {/* Deposit Button */}
            {/* <TouchableOpacity
                style={styles.depositButton}
                onPress={() => navigation.navigate("Deposit" as never)}
            >
                <Icon name="money" size={16} color="#FFD700" />
                 <Text style={styles.depositText}> Deposit</Text>
        </TouchableOpacity>
        */}

            {/* Login Button */}
            <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
            >
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Sports", { screen: "RegisterScreen" })}
            >
                <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingVertical: 4,
    },

    depositButton: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 4,
        // backgroundColor: "rgba(242, 219, 11, 0.9)",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },

    depositText: {
        color: "#fff",
        fontWeight: "500",

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
});
export default React.memo(HeaderLogin);
