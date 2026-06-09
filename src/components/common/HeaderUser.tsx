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
import { getItem, setItem } from "../utils/local-storage";
import { logoutUser } from "../utils/logout";
import { makeRequest } from "../utils/makeRequest";

const { width } = Dimensions.get("window");

const HeaderUser = () => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation();

    const user = state?.user;

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [mpesaModalVisible, setMpesaModalVisible] = useState(false);

    const slideAnim = useRef(new Animated.Value(width)).current;
    const socketSubscribed = useRef<string | null>(null);
    const latestUserRef = useRef(user);

    useEffect(() => {
        latestUserRef.current = user;
    }, [user]);

    /**
     * Persist user data to AsyncStorage (and SQLite if credentials exist)
     * without blocking UI. We keep this here to reuse for socket updates
     * and silent re-auth on app launch.
     */
    const persistUserState = useCallback(async (userData: any) => {
        try {
            await setItem("user", userData);

            // Update offline credentials if we have them (keeps SQLite cache fresh)
            try {
                const { getOfflineCredentials, saveOfflineCredentials } = await import("../../services/offlineDatabase");
                const creds = await getOfflineCredentials();

                if (creds?.phone_number && creds?.password) {
                    await saveOfflineCredentials({
                        phone_number: creds.phone_number,
                        password: creds.password,
                        token: userData?.access_token || userData?.token || creds.token,
                        user_data: userData,
                        stored_at: new Date().toISOString(),
                    });
                }
            } catch (dbErr) {
                console.warn("[HeaderUser] Failed to update offline credentials", dbErr);
            }
        } catch (storageErr) {
            console.warn("[HeaderUser] Failed to persist user", storageErr);
        }
    }, []);

    /**
     * Fetch latest balance/bonus via HTTP as a fallback on launch.
     * This complements socket updates to keep the stored user in sync.
     */
    const fetchLatestBalance = useCallback(async () => {
        const baseUser = latestUserRef.current;
        if (!baseUser) return;

        const memberId = baseUser?.member_id || baseUser?.profile_id;
        if (!memberId) return;

        try {
            const response = await makeRequest({
                url: `wallet-details-balance?owner=member&&member_id=${memberId}`,
                method: "GET",
            });

            const status = (response as any)?.status ?? (response as any)?.[0];
            const payload = (response as any)?.data ?? (response as any)?.[1];

            if (![200, 201].includes(status)) return;

            const currentBalance =
                payload?.data?.currentBalance ??
                payload?.currentBalance ??
                payload?.balance ??
                baseUser?.balance;

            const currentBonus =
                payload?.data?.bonus ??
                payload?.bonus ??
                baseUser?.bonus;

            const nextUser = {
                ...baseUser,
                balance: currentBalance,
                bonus: currentBonus,
                token: baseUser?.token || baseUser?.access_token,
                access_token: baseUser?.access_token || baseUser?.token,
            };

            dispatch({ type: "SET", key: "user", payload: nextUser });
            latestUserRef.current = nextUser;
            await persistUserState(nextUser);
        } catch (err) {
            console.warn("[HeaderUser] Balance refresh failed", err);
        }
    }, [dispatch, persistUserState]);

    /**
     * Silent session hydration on app launch:
     * 1) Load user from AsyncStorage if present.
     * 2) If missing, try offline credentials in SQLite and log in to refresh session.
     */
    useEffect(() => {
        let mounted = true;

        const hydrateUser = async () => {
            if (latestUserRef.current) return; // already have user in state

            // 1) Fast path: pull cached user
            const cached = await getItem("user");
            if (cached && mounted) {
                const hydrated = {
                    ...cached,
                    token: cached?.token || cached?.access_token,
                    access_token: cached?.access_token || cached?.token,
                };
                dispatch({ type: "SET", key: "user", payload: hydrated });
                latestUserRef.current = hydrated;
                await persistUserState(hydrated);
                await fetchLatestBalance();
                return;
            }

            // 2) Fallback: offline credentials -> background login
            try {
                const { getOfflineCredentials } = await import("../../services/offlineDatabase");
                const creds = await getOfflineCredentials();

                if (!mounted || !creds?.phone_number || !creds?.password) return;

                const response = await makeRequest({
                    url: "member-token",
                    method: "POST",
                    data: { phone_number: creds.phone_number, password: creds.password },
                });

                if ([200, 201].includes(response.status) && response.data?.access_token) {
                    const hydrated = {
                        ...response.data,
                        token: response.data.access_token, // normalize
                        access_token: response.data.access_token,
                    };

                    if (!mounted) return;
                    dispatch({ type: "SET", key: "user", payload: hydrated });
                    latestUserRef.current = hydrated;

                    // Persist to storage & refresh offline creds
                    await persistUserState(hydrated);

                    // Fetch latest balance once we have a fresh token
                    await fetchLatestBalance();
                }
            } catch (err) {
                console.warn("[HeaderUser] Silent login failed", err);
            }
        };

        hydrateUser();

        return () => {
            mounted = false;
        };
    }, [dispatch, persistUserState, fetchLatestBalance]);

    /* ================= DRAWER ================= */
    const openDrawer = useCallback(() => {
        setDrawerVisible(true);

        // 🔥 ensure animation always starts from hidden
        slideAnim.setValue(width);

        requestAnimationFrame(() => {
            Animated.timing(slideAnim, {
                toValue: width - 260,
                duration: 220,
                useNativeDriver: true,
            }).start();
        });
    }, [slideAnim]);

    const closeDrawer = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 180,
            useNativeDriver: true,
        }).start(() => setDrawerVisible(false));
    }, [slideAnim]);

    /* ================= SOCKET ================= */
    useEffect(() => {
        if (!user?.profile_id) return;

        const event = `user#profile#${user.profile_id}`;

        if (socketSubscribed.current === event) return;
        socketSubscribed.current = event;

        if (!socket.connected) socket.connect();

        if (socket.connected) {
            socket.emit('user.profile', user?.profile_id);
        }

        const handler = async (data: any) => {
            if (!data) return;

            const baseUser = latestUserRef.current || user;
            const nextUser = {
                ...baseUser,
                balance: data.balance,
                bonus: data.bonus,
                token: baseUser?.token || baseUser?.access_token,
                access_token: baseUser?.access_token || baseUser?.token,
            };

            dispatch({ type: "SET", key: "user", payload: nextUser });
            latestUserRef.current = nextUser;
            await persistUserState(nextUser);
        };

        socket.on(event, handler);

        return () => {
            socket.off(event, handler);
            socketSubscribed.current = null;
        };
    }, [user?.profile_id, dispatch, persistUserState]);

    // Run a one-time balance refresh on launch when user is available
    useEffect(() => {
        if (!user?.profile_id && !user?.member_id) return;
        fetchLatestBalance();
    }, [user?.profile_id, user?.member_id, fetchLatestBalance]);

    /* ================= NAV ================= */
    const goTo = useCallback((screen: string) => {
        closeDrawer();

        InteractionManager.runAfterInteractions(() => {
            navigation.navigate("Sports", { screen });
        });
    }, [closeDrawer, navigation]);

    /* ================= LOGOUT ================= */
    const logout = useCallback(async () => {
        await logoutUser({
            dispatch,
            navigation,
            beforeReset: closeDrawer,
        });
    }, [dispatch, closeDrawer, navigation]);

    if (!user) return null;

    return (
        <>
            {/* HEADER */}
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.depositBtn}
                    onPress={() => goTo("DepositScreen")}
                >
                    <Text style={styles.depositText}>
                        KES {formatToFloat(user?.balance) || 0}
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
                            KES {formatToFloat(user.balance) || 0}
                        </Text>

                        <Text style={styles.drawerBonus}>
                            Bonus: KES {formatToFloat(user?.bonus || 0)}
                        </Text>
                    </View>

                    <MenuItem label="Deposit" onPress={() => goTo("DepositScreen")} />
                    <MenuItem label="Withdraw" onPress={() => goTo("WithdrawScreen")} />
                    <MenuItem label="My Bets" onPress={() => goTo("MyBetsScreen")} />
                    <MenuItem label="Promotions" onPress={() => goTo("PromotionsScreen")} />
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
