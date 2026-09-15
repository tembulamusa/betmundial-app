import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Share,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { getItem, setItem, normalizeUser } from "../../components/utils/local-storage";
import { theme } from "../../theme";

const HOW_IT_WORKS = [
    { title: "Create", description: "Create your unique affiliate code.", icon: "edit" as const },
    { title: "Share", description: "Share with friends and your network.", icon: "share" as const },
    { title: "Earn", description: "Your friends play, you earn rewards.", icon: "card-giftcard" as const },
];

export default function AffiliateScreen() {
    const navigation = useNavigation<any>();
    const [state, dispatch] = useContext(Context);
    const user = state?.user;
    const [promoCode, setPromoCode] = useState<string | null>(user?.promo_code || null);
    const [customCode, setCustomCode] = useState("");
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (!user) {
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
        }
    }, [dispatch, user]);

    useEffect(() => {
        setPromoCode(user?.promo_code || null);
    }, [user?.promo_code]);

    const loadStats = useCallback(async () => {
        if (!user) return;
        setLoadingStats(true);
        const res = await makeRequest({
            url: "/user/affiliate/stats",
            method: "GET",
            apiVersion: 2,
        });
        if (res.status == 200) {
            setStats((res.data as any)?.data || res.data);
        }
        setLoadingStats(false);
    }, [user]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    const persistPromoCode = async (code: string) => {
        setPromoCode(code);
        const nextUser = normalizeUser({ ...(user || {}), promo_code: code });
        await setItem("user", nextUser);
        dispatch({ type: "SET", key: "user", payload: nextUser });
    };

    const createCode = async (auto: boolean) => {
        if (!user) {
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
            return;
        }
        setGenerating(true);
        setMessage(null);
        const payload = auto
            ? undefined
            : { promo_code: customCode.trim(), code: customCode.trim() };
        const res = await makeRequest({
            url: "/user/promo-code",
            method: "POST",
            apiVersion: 2,
            data: payload,
        });
        const body: any = res.data;
        const created =
            body?.promo_code ||
            body?.data?.promo_code ||
            body?.code ||
            body?.data?.code ||
            (!auto ? customCode.trim() : null);

        if ((res.status == 200 || res.status == 201) && created) {
            await persistPromoCode(String(created));
            setMessage("Affiliate code created successfully");
        } else {
            setMessage(body?.message || body?.error || res.error || "Unable to create code");
        }
        setGenerating(false);
    };

    const shareCode = async () => {
        if (!promoCode) return;
        const url = `https://betmundial.com/signup?promo=${encodeURIComponent(promoCode)}`;
        try {
            await Share.share({
                message: `Join BetMundial with my affiliate code ${promoCode}: ${url}`,
                url,
            });
        } catch {
            Alert.alert("Share", url);
        }
    };

    const referrals =
        stats?.total_referrals ??
        stats?.referral_count ??
        stats?.referrals?.length ??
        0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() =>
                        navigation.canGoBack()
                            ? navigation.goBack()
                            : navigation.navigate("Sports", { screen: "HomeMain" })
                    }
                >
                    <Icon name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Affiliate</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your affiliate code</Text>
                    {promoCode ? (
                        <>
                            <Text style={styles.codeValue}>{promoCode}</Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={shareCode}>
                                <FontAwesome name="share-alt" size={14} color="#fff" />
                                <Text style={styles.primaryBtnText}>Share code</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.hint}>
                                Create an automatic code or choose your own.
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Custom code (optional)"
                                placeholderTextColor="#94a3b8"
                                value={customCode}
                                autoCapitalize="characters"
                                onChangeText={setCustomCode}
                            />
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                disabled={generating}
                                onPress={() => void createCode(true)}
                            >
                                {generating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryBtnText}>Generate code</Text>
                                )}
                            </TouchableOpacity>
                            {customCode.trim() ? (
                                <TouchableOpacity
                                    style={styles.secondaryBtn}
                                    disabled={generating}
                                    onPress={() => void createCode(false)}
                                >
                                    <Text style={styles.secondaryBtnText}>Use custom code</Text>
                                </TouchableOpacity>
                            ) : null}
                        </>
                    )}
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Referrals</Text>
                    {loadingStats ? (
                        <ActivityIndicator color={theme.accent} />
                    ) : (
                        <Text style={styles.statValue}>{referrals}</Text>
                    )}
                    <Text style={styles.hint}>Friends who joined with your code</Text>
                </View>

                <Text style={styles.sectionTitle}>How it works</Text>
                {HOW_IT_WORKS.map((step) => (
                    <View key={step.title} style={styles.stepRow}>
                        <View style={styles.stepIcon}>
                            <Icon name={step.icon} size={18} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepTitle}>{step.title}</Text>
                            <Text style={styles.hint}>{step.description}</Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("Sports", { screen: "PrivacyPolicyScreen" })
                    }
                >
                    <Text style={styles.link}>Privacy Policy</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: theme.pageHeaderBackground,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    title: { color: "#fff", fontSize: 18, fontWeight: "700" },
    content: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15, marginBottom: 10 },
    codeValue: {
        color: "#ffc428",
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 12,
    },
    hint: { color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 18 },
    input: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 10,
        marginBottom: 12,
    },
    primaryBtn: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    secondaryBtn: {
        marginTop: 10,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.accent,
    },
    secondaryBtnText: { color: theme.accent, fontWeight: "700" },
    message: { color: "#86efac", marginTop: 10, textAlign: "center" },
    statValue: { color: "#ffc428", fontSize: 32, fontWeight: "800", marginBottom: 4 },
    sectionTitle: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 10,
        marginTop: 6,
    },
    stepRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    stepIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    stepTitle: { color: "#fff", fontWeight: "700", marginBottom: 2 },
    link: {
        color: theme.accent,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 18,
    },
});
