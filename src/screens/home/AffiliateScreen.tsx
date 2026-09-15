import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import { theme } from "../../theme";
import {
    AFFILIATE_LOGIN_REDIRECT,
    openLoginWithRedirect,
} from "../../components/utils/loginRedirect";
import {
    AffiliateEarnModal,
    AffiliateGetCodeModal,
    AffiliateShareModal,
    AffiliateTermsModal,
} from "../../components/affiliate/AffiliateModals";
import {
    AffiliateCodeCard,
    EarningsPanel,
    HowItWorksSection,
    LeaderboardPanel,
    MembersPanel,
    SupportFooter,
    TrustBar,
} from "../../components/affiliate/AffiliatePanels";
import {
    COMMISSIONS_ENDPOINT,
    resolveReferralCount,
} from "../../components/affiliate/affiliateHelpers";

const TAB_DETAIL = 0;
const TAB_EARNINGS = 1;
const TAB_MEMBERS = 2;

const TABS = [
    { key: TAB_DETAIL, label: "Detail", icon: "person" as const },
    { key: TAB_EARNINGS, label: "My Earnings", icon: "emoji-events" as const },
    { key: TAB_MEMBERS, label: "My Members", icon: "groups" as const },
];

export default function AffiliateScreen() {
    const navigation = useNavigation<any>();
    const [state, dispatch] = useContext(Context);
    const user = state?.user;

    const [activeTab, setActiveTab] = useState(TAB_DETAIL);
    const [isLoading, setIsLoading] = useState(false);
    const [commissions, setCommissions] = useState<any>(null);
    const [promoCode, setPromoCode] = useState<string | null>(
        user?.promo_code || null
    );
    const [getCodeOpen, setGetCodeOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [earnOpen, setEarnOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            openLoginWithRedirect(dispatch, AFFILIATE_LOGIN_REDIRECT);
        }
    }, [dispatch, user]);

    useEffect(() => {
        setPromoCode(user?.promo_code || null);
    }, [user?.promo_code]);

    const loadCommissions = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const res = await makeRequest({
            url: COMMISSIONS_ENDPOINT,
            method: "GET",
            apiVersion: 2,
        });
        setIsLoading(false);
        if (res.status === 200) {
            const data = (res.data as any)?.data ?? res.data ?? null;
            setCommissions(data);
            if (data?.promo_code) {
                setPromoCode(String(data.promo_code));
            }
        }
    }, [user]);

    useEffect(() => {
        void loadCommissions();
    }, [loadCommissions]);

    // Once per visit: open get-code modal when user has no code (matches web).
    useEffect(() => {
        if (!user) return;
        if (user?.promo_code || promoCode) return;
        setGetCodeOpen(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
    }, []);

    const totalReferrals = useMemo(
        () => resolveReferralCount(commissions),
        [commissions]
    );

    const handleOpenShare = useCallback(() => {
        if (!promoCode) {
            setActiveTab(TAB_DETAIL);
            setGetCodeOpen(true);
            return;
        }
        setShareOpen(true);
    }, [promoCode]);

    const handleRequestGetCode = useCallback(() => {
        setGetCodeOpen(true);
    }, []);

    const handleCodeCreated = useCallback(
        (code: string) => {
            setPromoCode(code);
            void loadCommissions();
        },
        [loadCommissions]
    );

    const hasCode = Boolean(promoCode);

    if (!user) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() =>
                            navigation.canGoBack()
                                ? navigation.goBack()
                                : navigation.navigate("Sports", {
                                      screen: "HomeMain",
                                  })
                        }
                    >
                        <Icon name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Affiliate</Text>
                    <View style={{ width: 36 }} />
                </View>
                <View style={styles.gated}>
                    <Text style={styles.gatedText}>
                        Sign in to open your Affiliate dashboard.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() =>
                        navigation.canGoBack()
                            ? navigation.goBack()
                            : navigation.navigate("Sports", {
                                  screen: "HomeMain",
                              })
                    }
                >
                    <Icon name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Affiliate</Text>
                <View style={{ width: 36 }} />
            </View>

            <View style={styles.tabs}>
                {TABS.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, active && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Icon
                                name={tab.icon}
                                size={14}
                                color={active ? "#fff" : "rgba(255,255,255,0.55)"}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    active && styles.tabTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === TAB_DETAIL ? (
                    hasCode ? (
                        <>
                            <AffiliateCodeCard
                                commissions={commissions}
                                isLoading={isLoading}
                                promoCode={promoCode}
                                onOpenShare={handleOpenShare}
                                onRequestGetCode={handleRequestGetCode}
                                onOpenTerms={() => setTermsOpen(true)}
                            />
                            <LeaderboardPanel
                                commissions={commissions}
                                promoCode={promoCode}
                                onRequestGetCode={handleRequestGetCode}
                            />
                            <HowItWorksSection
                                referrals={totalReferrals}
                                isLoading={isLoading}
                                onOpenShare={handleOpenShare}
                                onOpenEarn={() => setEarnOpen(true)}
                            />
                            <TrustBar />
                        </>
                    ) : (
                        <>
                            <AffiliateCodeCard
                                commissions={commissions}
                                isLoading={isLoading}
                                promoCode={promoCode}
                                onOpenShare={handleOpenShare}
                                onRequestGetCode={handleRequestGetCode}
                                onOpenTerms={() => setTermsOpen(true)}
                            />
                            <HowItWorksSection
                                referrals={totalReferrals}
                                isLoading={isLoading}
                                onOpenShare={handleOpenShare}
                                onOpenEarn={() => setEarnOpen(true)}
                                brief
                            />
                            <LeaderboardPanel
                                commissions={commissions}
                                promoCode={promoCode}
                                onRequestGetCode={handleRequestGetCode}
                            />
                            <TrustBar />
                        </>
                    )
                ) : null}

                {activeTab === TAB_EARNINGS ? (
                    <EarningsPanel
                        commissions={commissions}
                        isLoading={isLoading}
                        onOpenShare={handleOpenShare}
                        promoCode={promoCode}
                    />
                ) : null}

                {activeTab === TAB_MEMBERS ? (
                    <MembersPanel
                        commissions={commissions}
                        isLoading={isLoading}
                    />
                ) : null}

                <SupportFooter />
            </ScrollView>

            <AffiliateGetCodeModal
                show={getCodeOpen}
                onHide={() => setGetCodeOpen(false)}
                onCreated={handleCodeCreated}
            />
            <AffiliateShareModal
                show={shareOpen}
                onHide={() => setShareOpen(false)}
                promoCode={promoCode}
            />
            <AffiliateEarnModal
                show={earnOpen}
                onHide={() => setEarnOpen(false)}
                onOpenShare={handleOpenShare}
                onOpenEarnings={() => setActiveTab(TAB_EARNINGS)}
                onOpenTerms={() => setTermsOpen(true)}
            />
            <AffiliateTermsModal
                show={termsOpen}
                onHide={() => setTermsOpen(false)}
            />
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
    tabs: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 4,
        gap: 6,
        backgroundColor: theme.background,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        backgroundColor: "rgba(167,31,102,0.35)",
        borderBottomColor: theme.accent,
    },
    tabText: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        fontWeight: "600",
    },
    tabTextActive: { color: "#fff", fontWeight: "800" },
    content: { padding: 14, paddingBottom: 40 },
    gated: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    gatedText: {
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
        fontSize: 14,
    },
});
