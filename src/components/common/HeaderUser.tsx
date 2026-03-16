import React, { useContext, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";
import { formatToFloat } from "../utils/formatters";
import ConfirmMpesaStatus from "./ConfirmMpesaStatus";

const { width } = Dimensions.get("window");

const HeaderUser = () => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation<any>();

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [mpesaModalVisible, setMpesaModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(width)).current;
    const user = state?.user;
    if (!user) return null;

    const openDrawer = () => {
        setDrawerVisible(true);
        Animated.timing(slideAnim, {
            toValue: width - 260,
            duration: 250,
            useNativeDriver: false,
        }).start();
    };

    const closeDrawer = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 200,
            useNativeDriver: false,
        }).start(() => setDrawerVisible(false));
    };

    const logout = () => {
        dispatch({ type: "DEL", key: "user" });
        closeDrawer();
        navigation.navigate("HomeScreen");
    };

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.depositBtn}
                    onPress={() => navigation.navigate("DepositScreen")}
                >
                    <FontAwesome name="money" size={18} color="#FFD700" />
                    <Text style={styles.depositText}>Deposit</Text>
                </TouchableOpacity>

                <Text style={styles.balance}>
                    BAL. KES {formatToFloat(user.balance) || 0}
                </Text>

                <TouchableOpacity onPress={openDrawer}>
                    <FontAwesome name="user-circle" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Drawer Modal */}
            <Modal visible={drawerVisible} transparent animationType="none">
                <Pressable style={styles.overlay} onPress={closeDrawer} />

                <Animated.View style={[styles.drawer, { left: slideAnim }]}>
                    <View style={styles.drawerHeader}>
                        <FontAwesome name="user-circle" size={40} color="#fff" />
                        <Text style={styles.drawerBalance}>
                            KES {formatToFloat(user.balance) || 0}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            closeDrawer();
                            navigation.navigate("Sports", { screen: "DepositScreen" });
                        }}
                    >
                        <FontAwesome name="money" size={18} color="#fff" />
                        <Text style={styles.menuText}>Deposit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            closeDrawer();
                            navigation.navigate("Sports", { screen: "WithdrawScreen" });
                        }}
                    >
                        <FontAwesome name="user" size={18} color="#fff" />
                        <Text style={styles.menuText}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            closeDrawer();
                            navigation.navigate("Sports", { screen: "MyBetsScreen" });
                        }}
                    >
                        <FontAwesome name="user" size={18} color="#fff" />
                        <Text style={styles.menuText}>My Bets</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            closeDrawer();
                            navigation.navigate("Sports", { screen: "SelfExcludeScreen" });
                        }}
                    >
                        <FontAwesome name="user" size={18} color="#fff" />
                        <Text style={styles.menuText}>Self Exclusion</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            closeDrawer();
                            setMpesaModalVisible(true); // open modal
                        }}
                    >
                        <FontAwesome name="user" size={18} color="#fff" />
                        <Text style={styles.menuText}>Check Mpesa Deposit status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={logout}>
                        <FontAwesome name="sign-out" size={18} color="#ff4d4d" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Modal>

            {/* MPESA Modal */}
            <Modal visible={mpesaModalVisible} transparent animationType="slide">
                <SafeAreaView style={styles.mpesaModalContainer}>
                    <View style={styles.mpesaModalBody}>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={styles.mpesaModalTitle}>Check Deposit Status</Text>
                            <ConfirmMpesaStatus />
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setMpesaModalVisible(false)}
                            >
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
};

export default React.memo(HeaderUser);

const styles = StyleSheet.create({
    container: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
    depositBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10,
    },
    depositText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
    balance: { color: "#38bdf8", marginRight: 10, fontWeight: "bold" },
    overlay: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.4)" },
    drawer: { position: "absolute", top: 0, width: 260, height: "100%", backgroundColor: "#0c0c24", paddingTop: 60, paddingHorizontal: 20 },
    drawerHeader: { alignItems: "center", marginBottom: 30 },
    drawerBalance: { color: "#38bdf8", marginTop: 8, fontSize: 16, fontWeight: "bold" },
    menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    menuText: { color: "#fff", marginLeft: 12, fontSize: 15 },
    logoutText: { color: "#ff4d4d", marginLeft: 12, fontSize: 15, fontWeight: "bold" },

    // MPESA Modal
    mpesaModalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
    mpesaModalBody: { backgroundColor: "#0c0c24", marginHorizontal: 20, borderRadius: 10, maxHeight: "80%" },
    mpesaModalTitle: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 20 },
    closeButton: { backgroundColor: "#a71f66", marginTop: 20, padding: 12, borderRadius: 10, alignItems: "center" },
    closeText: { color: "#fff", fontWeight: "700" },
});