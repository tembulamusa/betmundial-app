import React, { useState, useContext, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme';
import { getItem, setItem } from '../../components/utils/local-storage';
import { logoutUser } from '../../components/utils/logout';
import { Context } from '../../context/store';
import { makeRequest } from '../../components/utils/makeRequest';
import { formatToFloat } from '../../components/utils/formatters';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [state, dispatch] = useContext<any>(Context);
    const user = state?.user;
    const userRef = useRef(user);
    userRef.current = user;
    const refreshingRef = useRef(false);

    const [hydrating, setHydrating] = useState(!user);
    const [betCount, setBetCount] = useState(0);

    const refreshProfileData = useCallback(async (baseUser: any) => {
        if (!baseUser || refreshingRef.current) {
            return;
        }

        refreshingRef.current = true;

        try {
            const memberId = baseUser?.member_id || baseUser?.profile_id;
            let nextUser = {
                ...baseUser,
                token: baseUser?.token || baseUser?.access_token,
                access_token: baseUser?.access_token || baseUser?.token,
            };

            if (memberId) {
                try {
                    const response = await makeRequest({
                        url: `wallet-details-balance?owner=member&&member_id=${memberId}`,
                        method: "GET",
                    });

                    const status = (response as any)?.status ?? (response as any)?.[0];
                    const payload = (response as any)?.data ?? (response as any)?.[1];

                    if ([200, 201].includes(status)) {
                        nextUser = {
                            ...nextUser,
                            balance:
                                payload?.data?.currentBalance ??
                                payload?.currentBalance ??
                                payload?.balance ??
                                nextUser?.balance,
                            bonus:
                                payload?.data?.bonus ??
                                payload?.bonus ??
                                nextUser?.bonus ??
                                nextUser?.bonus_balance,
                        };
                    }
                } catch (error) {
                    console.warn("[ProfileScreen] Balance refresh failed", error);
                }
            }

            dispatch({ type: "SET", key: "user", payload: nextUser });
            await setItem("user", nextUser);

            try {
                const betsResponse = await makeRequest({
                    url: "/user/bets?size=20&page=1",
                    method: "GET",
                    apiVersion: 2,
                });

                if ([200, 201].includes(betsResponse.status)) {
                    const bets = betsResponse?.data?.data || [];
                    setBetCount(Array.isArray(bets) ? bets.length : 0);
                }
            } catch (error) {
                console.warn("[ProfileScreen] Bets refresh failed", error);
            }
        } finally {
            refreshingRef.current = false;
        }
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const loadProfile = async () => {
                let currentUser = userRef.current;

                if (!currentUser) {
                    currentUser = await getItem('user');
                    if (!active) {
                        return;
                    }

                    if (currentUser) {
                        dispatch({ type: "SET", key: "user", payload: currentUser });
                    }
                }

                if (!active) {
                    return;
                }

                setHydrating(false);

                if (!currentUser) {
                    dispatch({ type: "SET", key: "showloginmodal", payload: true });
                    return;
                }

                // Refresh quietly in the background — don't block the UI
                refreshProfileData(currentUser);
            };

            loadProfile();

            return () => {
                active = false;
            };
            // Only re-run when the screen gains focus, not when user object updates
        }, [dispatch, refreshProfileData])
    );

    const formatMoney = (value: any) =>
        formatToFloat(value ?? 0);

    const displayName =
        user?.member_details?.full_name ||
        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
        user?.username ||
        user?.msisdn ||
        'User';

    const phone =
        user?.member_details?.primary_phone ||
        user?.phone_number ||
        user?.msisdn ||
        user?.primary_phone ||
        'No phone';

    const balance = user?.balance ?? 0;
    const bonus = user?.bonus ?? user?.bonus_balance ?? 0;

    const statCards = [
        {
            title: 'My Bets',
            value: betCount,
            suffix: 'Bets',
            icon: 'receipt',
            color: '#0ea5e9',
            onPress: () => navigation.navigate("Sports", { screen: "MyBetsScreen" }),
        },
        {
            title: 'Deposit',
            value: `Bal. ${formatMoney(balance)}  Bonus. ${formatMoney(bonus)}`,
            suffix: 'KES',
            icon: 'account-balance-wallet',
            color: '#f59e0b',
            onPress: () => navigation.navigate("Sports", { screen: "DepositScreen" }),
        },
        {
            title: 'Withdraw',
            value: formatMoney(balance),
            suffix: 'KES',
            icon: 'payments',
            color: '#16a34a',
            onPress: () => navigation.navigate("Sports", { screen: "WithdrawScreen" }),
        },
    ];

    const policyLinks = [
        {
            label: "Licensing",
            icon: "gpp-good",
            onPress: () => navigation.navigate("LicensingScreen"),
        },
        {
            label: "Responsible Gaming",
            icon: "favorite",
            onPress: () => navigation.navigate("ResponsibleGamblingScreen"),
        },
        {
            label: "Getting Help",
            icon: "help",
            onPress: () => navigation.navigate("GettingHelpScreen"),
        },
        {
            label: "Contact Us",
            icon: "mail",
            onPress: () => navigation.navigate("ContactUsScreen"),
        },
        {
            label: "Self-Exclusion Info",
            icon: "block",
            onPress: () => navigation.navigate("SelfExclusionInfoScreen"),
        },
        {
            label: "18+ Protection",
            icon: "gpp-bad",
            onPress: () => navigation.navigate("MinorsRestrictionsScreen"),
        },
        {
            label: "Self-Assessment",
            icon: "assessment",
            onPress: () => navigation.navigate("SelfAssessmentScreen"),
        },
        {
            label: "Support for Friends",
            icon: "group",
            onPress: () => navigation.navigate("SupportForFriendsScreen"),
        },
    ];

    const actionLinks = [
        {
            label: "Deposit",
            icon: "account-balance-wallet",
            onPress: () => navigation.navigate("Sports", { screen: "DepositScreen" }),
        },
        {
            label: "Withdraw",
            icon: "payments",
            onPress: () => navigation.navigate("Sports", { screen: "WithdrawScreen" }),
        },
        {
            label: "My Bets",
            icon: "receipt-long",
            onPress: () => navigation.navigate("Sports", { screen: "MyBetsScreen" }),
        },
        {
            label: "Self Exclusion",
            icon: "block",
            isDanger: true,
            onPress: () => navigation.navigate("Sports", { screen: "SelfExcludeScreen" }),
        },
    ];

    const handleLogout = async () => {
        await logoutUser({ dispatch, navigation });
    };

    const openLoginModal = () => {
        dispatch({ type: "SET", key: "showloginmodal", payload: true });
    };

    if (hydrating) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="lock" size={64} color="#fff" />
                <Text style={styles.emptyTitle}>Please log in to view your account</Text>
                <Text style={styles.emptySubtitle}>
                    Sign in to see your balance, bets, and account settings.
                </Text>
                <TouchableOpacity style={styles.loginButton} onPress={openLoginModal}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {displayName.slice(0, 2).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.nameText}>{displayName}</Text>
                <Text style={styles.roleText}>{phone}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.statsGrid}>
                    {statCards.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.statCard, { backgroundColor: item.color }]}
                            onPress={item.onPress}
                        >
                            <Icon name={item.icon} size={24} color="#fff" />
                            <Text style={styles.statValue}>
                                {item.value} {item.suffix}
                            </Text>
                            <Text style={styles.statLabel}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>More Actions</Text>

                <View style={styles.linksContainer}>
                    {actionLinks.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.linkCard,
                                item.isDanger && { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 10 }
                            ]}
                            onPress={item.onPress}
                        >
                            <Icon name={item.icon} size={22} color="#fff" />
                            <Text style={styles.linkText}>{item.label}</Text>
                            <Icon name="chevron-right" size={22} color="#fff" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>18+ & Responsible Gaming</Text>

                <View style={styles.linksContainer}>
                    {policyLinks.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.linkCard}
                            onPress={item.onPress}
                        >
                            <Icon name={item.icon} size={22} color="#fff" />
                            <Text style={styles.linkText}>{item.label}</Text>
                            <Icon name="chevron-right" size={22} color="#fff" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={26} color="#fff" />
                <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    contentContainer: { padding: 12, paddingBottom: 48 },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },

    loadingText: { marginTop: 12, color: '#fff' },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: theme.background,
    },

    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 16,
        textAlign: 'center',
    },

    emptySubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },

    loginButton: {
        marginTop: 24,
        backgroundColor: '#a71f66',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 10,
    },

    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    headerCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
    },

    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },

    avatarText: { color: '#fff', fontSize: 24 },

    nameText: { color: '#fff', fontSize: 20, fontWeight: '700' },
    roleText: { color: '#fff', marginTop: 4 },

    section: { marginBottom: 12 },
    sectionTitle: { color: '#fff', fontSize: 12, marginBottom: 8 },

    statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },

    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        marginHorizontal: 4,
        alignItems: 'center',
    },

    statValue: { color: '#fff', fontWeight: '700', fontSize: 11, textAlign: 'center' },
    statLabel: { color: '#fff', marginTop: 4 },

    linksContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 10,
    },

    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },

    linkText: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 15,
    },

    logoutButton: {
        marginTop: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },

    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
