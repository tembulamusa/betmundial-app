import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    memo,
} from "react";

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
    InteractionManager,
} from "react-native";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";

import { Context } from "../../context/store";
import { formatToFloat } from "../utils/formatters";
import ConfirmMpesaStatus from "./ConfirmMpesaStatus";
import { theme } from "../../theme";
import socket from "../utils/SocketConnect";
import { setItem, removeItem, getItem } from "../utils/local-storage";

const { width } = Dimensions.get("window");

const HeaderUser = ({ user }: { user: any }) => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation();

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [mpesaModalVisible, setMpesaModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(width)).current;

    // ✅ LOCAL FAST STATE
    const [localUser, setLocalUser] = useState<any>(user);

    const socketSubscribed = useRef(false);



    /* ================= SYNC GLOBAL ================= */
    useEffect(() => {
        if (state?.user || user) {
            setLocalUser(state?.user || user);
        }
    }, [state?.user, user]);

    /* ================= DRAWER ================= */
    const openDrawer = useCallback(() => {
        setDrawerVisible(true);

        requestAnimationFrame(() => {
            Animated.timing(slideAnim, {
                toValue: width - 260,
                duration: 220,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    const closeDrawer = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 180,
            useNativeDriver: true,
        }).start(() => setDrawerVisible(false));
    }, []);

    /* ================= SOCKET (ONCE ONLY) ================= */
    useEffect(() => {
        if (!localUser?.profile_id || socketSubscribed.current) return;

        socketSubscribed.current = true;

        if (!socket.connected) {
            socket.connect();
        }

        const event = `user#profile#${localUser.profile_id}`;

        const handler = (data: any) => {
            if (!data) return;

            const nextUser = {
                ...localUser,
                balance: data.balance,
                bonus: data.bonus,
            };

            // ⚡ instant UI
            setLocalUser(nextUser);

            // 💤 defer global update
            InteractionManager.runAfterInteractions(() => {
                dispatch({
                    type: "SET",
                    key: "user",
                    payload: nextUser,
                });

                setItem("user", nextUser);
            });
        };

        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
        };

    }, [localUser?.profile_id]);

    /* ================= FAST NAV ================= */
    const goTo = useCallback((screen: string) => {
        closeDrawer();

        InteractionManager.runAfterInteractions(() => {
            navigation.navigate("Sports", { screen });
        });
    }, []);

    /* ================= LOGOUT ================= */
    const logout = useCallback(async () => {
        await removeItem("user");

        dispatch({ type: "DEL", key: "user" });

        closeDrawer();

        InteractionManager.runAfterInteractions(() => {
            navigation.navigate("HomeScreen");
        });
    }, []);

    if (!localUser) return null;

    return (
        <>
            {/* HEADER */}
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.depositBtn}
                    onPress={() => goTo("DepositScreen")}
                >
                    <Text style={styles.depositText}>
                        KES {formatToFloat(localUser?.balance) || 0}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={openDrawer}>
                    <FontAwesome name="user-circle" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* DRAWER */}
            <Modal visible={drawerVisible} transparent animationType="none">
                <Pressable style={styles.overlay} onPress={closeDrawer} />

                <Animated.View
                    style={[
                        styles.drawer,
                        { transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    <View style={styles.drawerHeader}>
                        <FontAwesome name="user-circle" size={40} color="#fff" />

                        <Text style={styles.drawerBalance}>
                            KES {formatToFloat(localUser.balance) || 0}
                        </Text>

                        <Text style={styles.drawerBonus}>
                            Bonus: KES {formatToFloat(localUser?.bonus || 0)}
                        </Text>
                    </View>

                    <MenuItem label="Deposit" onPress={() => goTo("DepositScreen")} />
                    <MenuItem label="Withdraw" onPress={() => goTo("WithdrawScreen")} />
                    <MenuItem label="My Bets" onPress={() => goTo("MyBetsScreen")} />
                    <MenuItem label="Self Exclusion" onPress={() => goTo("SelfExcludeScreen")} />

                    <MenuItem
                        label="Check Mpesa Deposit status"
                        onPress={() => {
                            closeDrawer();
                            setMpesaModalVisible(true);
                        }}
                    />

                    <TouchableOpacity style={styles.menuItem} onPress={logout}>
                        <FontAwesome name="sign-out" size={18} color="#ff4d4d" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Modal>

            {/* MPESA MODAL */}
            <Modal visible={mpesaModalVisible} transparent animationType="slide">
                <SafeAreaView style={styles.mpesaModalContainer}>
                    <View style={styles.mpesaModalBody}>
                        <ScrollView contentContainerStyle={styles.mpesaScrollContent}>
                            <Text style={styles.mpesaModalTitle}>
                                Check Deposit Status
                            </Text>

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

/* ================= MENU ITEM ================= */
const MenuItem = memo(({ label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <FontAwesome name="circle" size={8} color="#fff" />
        <Text style={styles.menuText}>{label}</Text>
    </TouchableOpacity>
));

export default memo(HeaderUser);
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
        color: "#000",
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
        backgroundColor: "#e70654",
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