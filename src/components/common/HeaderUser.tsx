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
    Alert,
} from "react-native";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";

import { Context } from "../../context/store";
import { formatToFloat } from "../utils/formatters";
import ConfirmMpesaStatus from "./ConfirmMpesaStatus";
import { theme } from "../../theme";
import socket from "../utils/SocketConnect";
import { getItem, setItem, normalizeUser } from "../utils/local-storage";
import { logoutUser } from "../utils/logout";
import { makeRequest } from "../utils/makeRequest";
import { fetchUserBalance, reconnectSocket } from "../../services/sessionSync";

const { width } = Dimensions.get("window");

// Same three-tier pink accent used by the web app's account drawer
// (src/assets/css/account-drawer.css --acc-pink / --acc-pink-soft / --acc-pink-deep),
// kept as exact hex matches so the two drawers read as the same design.
const ACCENT = {
    pink: "#e91e8c",
    pinkSoft: "#ff52d4",
    pinkDeep: theme.accent, // "#a71f66" — already shared with the rest of the app
    card: "rgba(255, 255, 255, 0.15)",
    border: "rgba(255, 255, 255, 0.08)",
    muted: "#9a9aa8",
    text: "rgba(255, 255, 255, 0.85)",
    gold: theme.deposit,
};

const DRAWER_WIDTH = Math.min(380, width);
const PROMO_WINS_COUNT = 0;

/** Mirrors the web drawer's formatMsisdn() so phone numbers render the same way. */
function formatMsisdn(msisdn?: string | null) {
    if (!msisdn) return "";
    const digits = String(msisdn).replace(/\D/g, "");
    if (digits.startsWith("254") && digits.length >= 12) {
        return `+254 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
    }
    if (digits.startsWith("0") && digits.length === 10) {
        return `+254 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
    }
    if (digits.length === 9) {
        return `+254 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    }
    return String(msisdn);
}

const comingSoon = (title: string) =>
    Alert.alert(title, `${title} will be available soon.`);

const HeaderUser = () => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const user = state?.user;

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [mpesaModalVisible, setMpesaModalVisible] = useState(false);
    const [showBonusTooltip, setShowBonusTooltip] = useState(false);

    const slideAnim = useRef(new Animated.Value(width)).current;
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
            const normalized = normalizeUser(userData);
            await setItem("user", normalized);

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

        try {
            const nextUser = await fetchUserBalance(baseUser);
            if (!nextUser) return;

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
                toValue: width - DRAWER_WIDTH,
                duration: 220,
                useNativeDriver: true,
            }).start();
        });
    }, [slideAnim]);

    const closeDrawer = useCallback(() => {
        setShowBonusTooltip(false);
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

        const subscribeProfile = () => {
            socket.emit("user.profile", user.profile_id);
        };

        reconnectSocket(user.profile_id);
        socket.on("connect", subscribeProfile);

        const handler = async (data: any) => {
            if (!data) return;

            const baseUser = latestUserRef.current || user;
            const bonus = data.bonus ?? baseUser?.bonus ?? baseUser?.bonus_balance;
            const nextUser = {
                ...baseUser,
                balance: data.balance,
                bonus,
                bonus_balance: bonus,
                token: baseUser?.token || baseUser?.access_token,
                access_token: baseUser?.access_token || baseUser?.token,
            };

            dispatch({ type: "SET", key: "user", payload: nextUser });
            latestUserRef.current = nextUser;
            await persistUserState(nextUser);
        };

        socket.on(event, handler);

        return () => {
            socket.off("connect", subscribeProfile);
            socket.off(event, handler);
        };
    }, [user?.profile_id, dispatch, persistUserState]);

    useEffect(() => {
        if (!user?.profile_id && !user?.member_id) return;

        const interval = setInterval(() => {
            if (!socket.connected) {
                fetchLatestBalance();
            }
        }, 60 * 1000);

        return () => clearInterval(interval);
    }, [user?.profile_id, user?.member_id, fetchLatestBalance]);

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

    const balance = formatToFloat(user?.balance || 0);
    const bonus = formatToFloat(user?.bonus ?? user?.bonus_balance ?? 0);

    return (
        <>
            {/* ROW 2 — mirrors web profile-menu.js mobile layout */}
            <View style={styles.container}>
                <Text style={styles.balanceAmount} numberOfLines={1}>
                    {balance}
                </Text>

                <TouchableOpacity
                    style={styles.depositWrap}
                    onPress={() => goTo("DepositScreen")}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[theme.deposit, theme.deposit]}
                        style={styles.depositBtn}
                    >
                        <FontAwesome name="money" size={12} color="#8d2585" />
                        <Text style={styles.depositLabel}>Deposit</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.withdrawBtn}
                    onPress={() => goTo("WithdrawScreen")}
                    activeOpacity={0.85}
                >
                    <MaterialIcons name="file-upload" size={14} color={theme.accent} />
                    <Text style={styles.withdrawLabel}>Withdraw</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.accountBtn}
                    onPress={openDrawer}
                    activeOpacity={0.85}
                    accessibilityLabel="Account"
                >
                    <View style={styles.accountIconCircle}>
                        <FontAwesome name="user" size={14} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* ACCOUNT DRAWER — mirrors the web app's account-drawer (mobile-menu.js) */}
            <Modal visible={drawerVisible} transparent animationType="none">
                <Pressable style={styles.overlay} onPress={closeDrawer} />

                <Animated.View
                    style={[
                        styles.drawer,
                        { transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    <View
                        style={[
                            styles.drawerHeaderBand,
                            { paddingTop: insets.top + 12 },
                        ]}
                    >
                        <View style={styles.drawerHeaderRow}>
                            <View style={styles.drawerHeaderLeft}>
                                <View style={styles.headerIconBadge}>
                                    <FontAwesome name="user" size={18} color="#fff" />
                                </View>
                                <View style={styles.shrink}>
                                    <Text style={styles.drawerTitle}>Account</Text>
                                    <Text style={styles.drawerSubtitle}>
                                        Manage your account and wallet
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={closeDrawer}
                                accessibilityLabel="Close"
                            >
                                <Text style={styles.closeBtnText}>×</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.drawerScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* User row */}
                        <View style={styles.userRow}>
                            <View style={styles.avatar}>
                                <FontAwesome name="user" size={26} color="#fff" />
                            </View>
                            <View style={styles.shrink}>
                                <Text style={styles.phoneText}>
                                    {formatMsisdn(user?.msisdn) || user?.msisdn}
                                </Text>
                                <View style={styles.verifiedPill}>
                                    <FontAwesome
                                        name="check-circle"
                                        size={12}
                                        color={ACCENT.pink}
                                    />
                                    <Text style={styles.verifiedText}>Verified Account</Text>
                                </View>
                            </View>
                        </View>

                        {/* Wallet card */}
                        <View style={styles.walletCard}>
                            <View style={styles.walletLabelRow}>
                                <MaterialIcons
                                    name="account-balance-wallet"
                                    size={16}
                                    color={ACCENT.pink}
                                />
                                <Text style={styles.walletLabel}>WALLET</Text>
                            </View>

                            <View style={styles.walletGrid}>
                                <View style={styles.walletMain}>
                                    <Text style={styles.walletMainLabel}>
                                        Available Balance
                                    </Text>
                                    <Text style={styles.walletMainAmount}>
                                        KES {balance}
                                    </Text>
                                </View>

                                <View style={styles.walletDivider} />

                                <View style={styles.walletSide}>
                                    <View style={styles.walletSideRow}>
                                        <View style={styles.walletSideLabelRow}>
                                            <FontAwesome name="gift" size={13} color={ACCENT.pink} />
                                            <Text style={styles.walletSideLabel}>Bonus</Text>
                                        </View>
                                        <View style={styles.bonusAmountRow}>
                                            <Text style={styles.walletSideAmount}>
                                                KES {bonus}
                                            </Text>
                                            <TouchableOpacity
                                                style={styles.bonusTooltipTrigger}
                                                onPress={() => setShowBonusTooltip((v) => !v)}
                                                accessibilityLabel="Bonus terms"
                                            >
                                                <Text style={styles.bonusTooltipTriggerText}>
                                                    Terms
                                                </Text>
                                                <FontAwesome
                                                    name="info-circle"
                                                    size={11}
                                                    color={ACCENT.muted}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {showBonusTooltip && (
                                        <Text style={styles.bonusTooltipBubble}>
                                            Bonus funds are subject to wagering requirements and
                                            expiry. See the Promotions page for full T&Cs.
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Deposit / Withdraw */}
                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={styles.actionDepositWrap}
                                onPress={() => goTo("DepositScreen")}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={[theme.deposit, theme.deposit]}
                                    style={styles.actionDeposit}
                                >
                                    <FontAwesome name="money" size={16} color="#8d2585" />
                                    <Text style={styles.actionDepositText}>Deposit</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionWithdraw}
                                onPress={() => goTo("WithdrawScreen")}
                            >
                                <MaterialIcons
                                    name="file-upload"
                                    size={16}
                                    color={ACCENT.pink}
                                />
                                <Text style={styles.actionWithdrawText}>Withdraw</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Activity */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Activity</Text>
                            <View style={styles.sectionCard}>
                                <DrawerItem
                                    icon={<MaterialIcons name="list" size={16} color={ACCENT.pink} />}
                                    label="My Bets"
                                    onPress={() => goTo("MyBetsScreen")}
                                />
                                <DrawerItem
                                    icon={<FontAwesome name="gift" size={14} color={ACCENT.pink} />}
                                    label="Promo Wins"
                                    count={PROMO_WINS_COUNT}
                                    onPress={() => comingSoon("Promo Wins")}
                                />
                                <DrawerItem
                                    icon={<MaterialIcons name="phone-iphone" size={16} color={ACCENT.pink} />}
                                    label="Check MPESA Deposit status"
                                    onPress={() => {
                                        closeDrawer();
                                        setMpesaModalVisible(true);
                                    }}
                                />
                                <DrawerItem
                                    icon={<FontAwesome name="bullhorn" size={14} color={ACCENT.pink} />}
                                    label="Promotions"
                                    onPress={() => goTo("PromotionsScreen")}
                                    last
                                />
                            </View>
                        </View>

                        {/* Account */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Account</Text>
                            <View style={styles.sectionCard}>
                                <DrawerItem
                                    icon={<MaterialIcons name="lock-outline" size={16} color={ACCENT.pink} />}
                                    label="Change Password"
                                    onPress={() => comingSoon("Change Password")}
                                />
                                <DrawerItem
                                    icon={<MaterialIcons name="security" size={16} color={ACCENT.pink} />}
                                    label="Exclude myself from betting"
                                    onPress={() => goTo("SelfExcludeScreen")}
                                    last
                                />
                            </View>
                        </View>

                        {/* Logout */}
                        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                            <FontAwesome name="sign-out" size={16} color={ACCENT.pink} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </ScrollView>
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

/* ================= DRAWER LIST ITEM ================= */
const DrawerItem = memo(
    ({
        icon,
        label,
        count,
        onPress,
        last,
    }: {
        icon: React.ReactNode;
        label: string;
        count?: number;
        onPress: () => void;
        last?: boolean;
    }) => (
        <TouchableOpacity
            style={[styles.drawerItem, last && styles.drawerItemLast]}
            onPress={onPress}
        >
            <View style={styles.drawerItemIcon}>{icon}</View>
            <View style={styles.drawerItemLabelRow}>
                <Text style={styles.drawerItemLabel}>{label}</Text>
                {typeof count === "number" && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                )}
            </View>
            <FontAwesome name="chevron-right" size={12} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
    )
);

export default memo(HeaderUser);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        flex: 1,
        flexWrap: "wrap",
        rowGap: 6,
        columnGap: 10,
    },
    balanceAmount: {
        color: ACCENT.gold,
        fontSize: 14,
        fontWeight: "700",
        marginRight: 2,
        flexShrink: 0,
    },
    depositWrap: {
        borderRadius: 6,
        overflow: "hidden",
    },
    depositBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        minHeight: 30,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.deposit,
    },
    depositLabel: {
        color: "#111",
        fontWeight: "700",
        fontSize: 11,
        textTransform: "uppercase",
    },
    withdrawBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingVertical: 5,
        paddingHorizontal: 8,
        minHeight: 30,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: theme.accent,
        backgroundColor: "transparent",
    },
    withdrawLabel: {
        color: theme.accent,
        fontWeight: "700",
        fontSize: 9,
        textTransform: "uppercase",
    },
    accountBtn: {
        marginLeft: 0,
    },
    accountIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    shrink: {
        flexShrink: 1,
        minWidth: 0,
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
        width: DRAWER_WIDTH,
        height: "100%",
        backgroundColor: theme.background,
    },
    drawerHeaderBand: {
        width: "100%",
        alignSelf: "stretch",
        backgroundColor: ACCENT.card,
        paddingHorizontal: 16,
        paddingBottom: 14,
    },
    drawerScrollContent: {
        padding: 16,
        paddingTop: 14,
        paddingBottom: 40,
        gap: 14,
    },

    /* Header */
    drawerHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
    },
    drawerHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexShrink: 1,
    },
    headerIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: ACCENT.pink,
        alignItems: "center",
        justifyContent: "center",
    },
    drawerTitle: {
        color: ACCENT.text,
        fontSize: 20,
        fontWeight: "700",
    },
    drawerSubtitle: {
        color: ACCENT.muted,
        fontSize: 13,
        marginTop: 2,
    },
    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: {
        color: ACCENT.text,
        fontSize: 26,
        lineHeight: 26,
    },

    /* User row */
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: ACCENT.pink,
        alignItems: "center",
        justifyContent: "center",
    },
    phoneText: {
        color: ACCENT.text,
        fontSize: 18,
        fontWeight: "700",
    },
    verifiedPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    verifiedText: {
        color: ACCENT.muted,
        fontSize: 12,
        fontWeight: "500",
    },

    /* Wallet card */
    walletCard: {
        backgroundColor: ACCENT.card,
        borderWidth: 1,
        borderColor: ACCENT.border,
        borderRadius: 14,
        padding: 14,
    },
    walletLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },
    walletLabel: {
        color: ACCENT.muted,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
    },
    walletGrid: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
    },
    walletMain: {
        flex: 2,
    },
    walletMainLabel: {
        color: ACCENT.muted,
        fontSize: 13,
        marginBottom: 4,
    },
    walletMainAmount: {
        color: ACCENT.gold,
        fontSize: 20,
        fontWeight: "700",
    },
    walletDivider: {
        width: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    walletSide: {
        flex: 3,
        justifyContent: "center",
    },
    walletSideRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    walletSideLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        flexShrink: 1,
    },
    walletSideLabel: {
        color: ACCENT.muted,
        fontSize: 13,
        fontWeight: "500",
    },
    bonusAmountRow: {
        alignItems: "flex-end",
        gap: 3,
    },
    walletSideAmount: {
        color: ACCENT.gold,
        fontSize: 14,
        fontWeight: "700",
    },
    bonusTooltipTrigger: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    bonusTooltipTriggerText: {
        color: ACCENT.muted,
        fontSize: 11,
        textDecorationLine: "underline",
    },
    bonusTooltipBubble: {
        marginTop: 8,
        padding: 8,
        borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.35)",
        color: ACCENT.text,
        fontSize: 11,
        lineHeight: 15,
    },

    /* Deposit / Withdraw */
    actionsRow: {
        flexDirection: "row",
        gap: 10,
    },
    actionDepositWrap: {
        flex: 1,
        borderRadius: 10,
        overflow: "hidden",
    },
    actionDeposit: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.deposit,
    },
    actionDepositText: {
        color: "#111",
        fontSize: 15,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    actionWithdraw: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: ACCENT.pink,
        backgroundColor: "transparent",
    },
    actionWithdrawText: {
        color: ACCENT.pink,
        fontSize: 15,
        fontWeight: "700",
    },

    /* Sections */
    section: {
        gap: 6,
    },
    sectionLabel: {
        color: ACCENT.muted,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        paddingHorizontal: 2,
    },
    sectionCard: {
        backgroundColor: ACCENT.card,
        borderWidth: 1,
        borderColor: ACCENT.border,
        borderRadius: 14,
        overflow: "hidden",
    },
    drawerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        minHeight: 50,
        paddingHorizontal: 13,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
    },
    drawerItemLast: {
        borderBottomWidth: 0,
    },
    drawerItemIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: "rgba(233,30,140,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },
    drawerItemLabelRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    drawerItemLabel: {
        color: ACCENT.text,
        fontSize: 14,
        fontWeight: "600",
    },
    countBadge: {
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 9,
        backgroundColor: ACCENT.pink,
        alignItems: "center",
        justifyContent: "center",
    },
    countBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
    },

    /* Logout */
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 46,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: ACCENT.pink,
        backgroundColor: "transparent",
    },
    logoutText: {
        color: ACCENT.pink,
        fontSize: 15,
        fontWeight: "700",
    },

    /* Mpesa modal (unchanged) */
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
