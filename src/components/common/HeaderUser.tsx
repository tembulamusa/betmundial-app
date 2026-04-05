import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
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
    AppState,
    Alert,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";
import { formatToFloat } from "../utils/formatters";
import ConfirmMpesaStatus from "./ConfirmMpesaStatus";
import { theme } from "../../theme";
import socket from "../utils/SocketConnect";
import { makeRequest } from "../utils/makeRequest";
import useInterval from "../../hooks/set-interval.hook";
import { getItem, setItem, removeItem } from "../utils/local-storage";

const { width } = Dimensions.get("window");

const HeaderUser = () => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation();

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [mpesaModalVisible, setMpesaModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(width)).current;
    const [user, setUser] = useState(state?.user);

    const updateStoredUser = useCallback(async (nextUser: any) => {
        if (!nextUser) return;
        setUser(nextUser);
        dispatch({ type: "SET", key: "user", payload: nextUser });
        await setItem("user", nextUser);
    }, [dispatch]);

    const refreshUserBalance = useCallback(async () => {
        if (!user?.member_id) return;

        const response = await makeRequest<any>({
            url: `wallet-details-balance?owner=member&&member_id=${user.member_id}`,
            method: "GET",
        });

        if (![200, 201].includes(response.status) || !response.data) {
            return;
        }

        const nextUser = {
            ...user,
            balance:
                response.data?.data?.currentBalance ??
                response.data?.currentBalance ??
                user.balance,
            bonus:
                response.data?.data?.bonusBalance ??
                response.data?.data?.bonus_balance ??
                response.data?.bonusBalance ??
                response.data?.bonus_balance ??
                user.bonus,
        };

        dispatch({
            type: "SET",
            key: "user",
            payload: nextUser,
        });

        await setItem("user", nextUser);
    }, [dispatch, user]);

    const handleTokenRefresh = useCallback(async () => {
        if (!user) return;

        const endpoint = "/auth/token/refresh";
        const values = { refresh_token: user?.refresh_token };

        const result = await makeRequest<any>({
            url: endpoint,
            method: "POST",
            data: values,
            apiVersion: 2,
        });

        if ([200, 201, 204].includes(result.status)) {
            await updateStoredUser(result.data ?? user);
            return;
        }

        await removeItem("user");
        dispatch({ type: "DEL", key: "user" });
        dispatch({ type: "SET", key: "showloginmodal", payload: true });
        dispatch({ type: "SET", key: "sessionMessage", payload: "User Session Expired. Please Login Again" });
    }, [dispatch, updateStoredUser]);

    // useInterval(async () => {
    //     if (user?.balance && !socket.connected) {
    //         refreshUserBalance();
    //     }
    // }, user ? 1000 * 60 : null);

    useInterval(async () => {
        try {
            const storedUser = await getItem("user");
            if (!storedUser) {
                dispatch({ type: "DEL", key: "user" });
                if (state?.showloginmodal === false) {
                    dispatch({ type: "SET", key: "showloginmodal", payload: true });
                }
            }
        } catch (err) {
            console.error("Expiry check failed:", err);
        }
    }, 1000 * 60 * 60);

    useInterval(async () => {
        if (user) {
            await handleTokenRefresh();
        }
    }, user ? 60 * 60 * 1000 * 7 : null);


    useEffect(() => {
        if (!user?.profile_id) return undefined;

        socket.emit("user.profile", user.profile_id);

        const profileEvent = `user#profile#${user.profile_id}`;
        const handleProfileUpdate = (data: any) => {
            // Alert.alert("Profile Update", JSON.stringify(data));
            if (!data) return;
            const nextUser = {
                ...user,
                balance: data.balance,
                bonus: data.bonus,
            };
            updateStoredUser(nextUser);
        };

        socket.on(profileEvent, handleProfileUpdate);
        return () => {
            socket.off(profileEvent, handleProfileUpdate);
        };
    }, [user, updateStoredUser]);



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

    const logout = async () => {
        await removeItem("user");
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
                    <Text style={styles.depositText}>
                        KES {formatToFloat(user?.balance) || 0}
                    </Text>
                </TouchableOpacity>

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

                        {/* BALANCE */}
                        <Text style={styles.drawerBalance}>
                            KES {formatToFloat(user.balance) || 0}
                        </Text>

                        {/* ✅ BONUS ADDED */}
                        <Text style={styles.drawerBonus}>
                            Bonus: KES {formatToFloat(user?.bonus || 0)}
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
                            setMpesaModalVisible(true);
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
                        <ScrollView
                            contentContainerStyle={styles.mpesaScrollContent}
                        >
                            <Text style={styles.mpesaModalTitle}>
                                Check Deposit Status
                            </Text>

                            <ConfirmMpesaStatus />

                            {/* ✅ FIXED CLOSE BUTTON */}
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

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
    },

    depositBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFB200",
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10,
    },

    depositText: {
        color: "#000000",
        marginLeft: 6,
        fontWeight: "bold",
    },

    overlay: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.4)",
    },

    drawer: {
        position: "absolute",
        top: 0,
        width: 260,
        height: "100%",
        backgroundColor: theme.background,
        paddingTop: 60,
        paddingHorizontal: 20,
    },

    drawerHeader: {
        alignItems: "center",
        marginBottom: 30,
    },

    drawerBalance: {
        color: "#fff",
        marginTop: 8,
        fontSize: 16,
        fontWeight: "bold",
    },

    /* ✅ BONUS STYLE */
    drawerBonus: {
        color: "#FFD700",
        marginTop: 4,
        fontSize: 14,
        fontWeight: "600",
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },

    menuText: {
        color: "#fff",
        marginLeft: 12,
        fontSize: 15,
    },

    logoutText: {
        color: "#ff4d4d",
        marginLeft: 12,
        fontSize: 15,
        fontWeight: "bold",
    },

    /* MODAL */
    mpesaModalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
    },

    mpesaModalBody: {
        backgroundColor: "#0c0c24",
        marginHorizontal: 20,
        borderRadius: 10,
        maxHeight: "80%",
    },
    mpesaScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    mpesaModalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
    },

    closeButton: {
        backgroundColor: "#e70654", // brighter for visibility
        marginTop: 20,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    closeText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
