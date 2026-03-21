import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { getItem } from '../../components/utils/local-storage';
import { Context } from '../../context/store';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [state] = useContext<any>(Context);

    const [user, setUser] = useState<any>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await getItem('user');
                setUser(storedUser);
                setProfileData(storedUser);
            } catch (error) {
                console.error("Error loading user:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const formatMoney = (value: any) =>
        Number(parseFloat(value ?? 0)).toFixed(2);

    const statCards = [
        {
            title: 'My Bets',
            value: summary?.total_collections ?? 0,
            suffix: 'Bets',
            icon: 'receipt',
            color: '#0ea5e9',
            onPress: () => navigation.navigate("Sports", { screen: "MyBetsScreen" }),
        },
        {
            title: 'Deposit',
            value: `Bal. ${formatMoney(profileData?.balance)}  Bonus. ${formatMoney(profileData?.bonus_balance)}`,
            suffix: 'KES',
            icon: 'account-balance-wallet',
            color: '#f59e0b',
            onPress: () => navigation.navigate("Sports", { screen: "DepositScreen" }),
        },
        {
            title: 'Withdraw',
            value: formatMoney(profileData?.balance),
            suffix: 'KES',
            icon: 'payments',
            color: '#16a34a',
            onPress: () => navigation.navigate("Sports", { screen: "WithdrawScreen" }),
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
        {
            label: "Check Mpesa Status",
            icon: "phone",
            onPress: () => navigation.navigate("Sports", { screen: "MpesaStatusScreen" }),
        },
    ];

    const handleLogout = () => {
        // 👉 Replace with your actual logout logic if needed
        navigation.navigate("Auth", { screen: "LoginScreen" });
    };

    if (loading) {
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
                <Icon name="person-off" size={64} color="#fff" />
                <Text style={styles.emptyTitle}>No profile found</Text>
            </View>
        );
    }

    const displayName =
        `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
        user?.username ||
        'User';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* HEADER */}
            <View style={styles.headerCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {displayName.slice(0, 2).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.nameText}>{displayName}</Text>
                <Text style={styles.roleText}>
                    {profileData?.phone_number || profileData?.msisdn || 'No phone'}
                </Text>
            </View>

            {/* QUICK STATS */}
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

            {/* ACTION LINKS */}
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

            {/* 🚪 LOGOUT BUTTON */}
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
    },

    loadingText: { marginTop: 12, color: '#fff' },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    emptyTitle: { color: '#fff', fontSize: 18 },

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
    roleText: { color: '#fff' },

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

    statValue: { color: '#fff', fontWeight: '700' },
    statLabel: { color: '#fff' },

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

    // 🚪 BIG LOGOUT BUTTON
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