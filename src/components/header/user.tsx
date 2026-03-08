import React, { useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Context } from "../../context/store";

const LoggedInUser = () => {
    const navigation = useNavigation();
    const [, dispatch] = useContext(Context);

    return (
        <View style={styles.container}>
            {/* Deposit Button */}
            <TouchableOpacity
                style={styles.depositButton}
                onPress={() => navigation.navigate("Deposit" as never)}
            >
                <Icon name="money" size={16} color="#FFD700" />
                <Text style={styles.depositText}> Deposit</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() =>
                    dispatch({
                        type: "SET",
                        key: "showloginmodal",
                        payload: true,
                    })
                }
            >
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Signup" as never)}
            >
                <Text style={styles.registerText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
};

export default React.memo(LoggedInUser);