import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Svg, { Circle, G } from "react-native-svg";
import { formatToFloat } from "../utils/formatters";
import { theme } from "../../theme";
import { makeRequest } from "../utils/makeRequest";
import { useNavigation } from "@react-navigation/native";
import {
    AffiliateGetCodeModal,
} from "./AffiliateModals";
import {
    AFFILIATE_STATS_ENDPOINT,
    CHART_COLORS,
    DUMMY_COUNTY_BREAKDOWN,
    DUMMY_EARNINGS,
    DUMMY_GENDER_BREAKDOWN,
    DUMMY_LEADERBOARD,
    HOW_INTRO,
    HOW_IT_WORKS,
    LEADERBOARD_ENDPOINT,
    PERIOD_OPTIONS,
    ROWS_PER_PAGE_OPTIONS,
    STATUS_OPTIONS,
    SUPPORT_EMAIL,
    avatarTone,
    formatDisplayDate,
    formatLeaderboardCode,
    getInitials,
    isInPeriod,
    pickCountyBreakdown,
    pickGenderBreakdown,
    pickLeaderboardList,
    pickList,
    pickNumber,
    resolveEarningAmount,
    resolveEarningDate,
    resolveEarningMonth,
    resolveEarningStatus,
    resolveJoinedAt,
    resolveLeaderboardCode,
    resolveLeaderboardEarnings,
    resolveLeaderboardMembers,
    resolveMemberName,
    resolveMemberPhone,
    resolveMemberStatus,
    resolveReferralCount,
    resolveTotalEarnings,
} from "./affiliateHelpers";
import {
    getAffiliateShareUrl,
    openAffiliateSocialShare,
} from "./affiliateShare";

function formatKes(value: any) {
    return `KES ${formatToFloat(value ?? 0)}`;
}

function StatusBadge({
    status,
}: {
    status?: string | null;
}) {
    const label = status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "—";
    const tone =
        status === "paid" || status === "active"
            ? styles.badgeOk
            : status === "pending"
              ? styles.badgePending
              : status === "inactive"
                ? styles.badgeInactive
                : styles.badgeNeutral;
    return (
        <View style={[styles.badge, tone]}>
            <Text style={styles.badgeText}>{label}</Text>
        </View>
    );
}

function OverviewCard({
    label,
    value,
    sub,
    icon,
    tone = "pink",
}: {
    label: string;
    value: string;
    sub?: string;
    icon: string;
    tone?: "pink" | "yellow";
}) {
    return (
        <View
            style={[
                styles.overviewCard,
                tone === "yellow" ? styles.overviewCardYellow : styles.overviewCardPink,
            ]}
        >
            <View
                style={[
                    styles.overviewIcon,
                    tone === "yellow"
                        ? styles.overviewIconYellow
                        : styles.overviewIconPink,
                ]}
            >
                <Icon name={icon} size={16} color="#fff" />
            </View>
            <Text style={styles.overviewLabel}>{label}</Text>
            <Text style={styles.overviewValue}>{value}</Text>
            {sub ? <Text style={styles.overviewSub}>{sub}</Text> : null}
        </View>
    );
}

function DonutChart({
    title,
    data,
    emptyLabel,
}: {
    title: string;
    data: { name: string; value: number }[];
    emptyLabel: string;
}) {
    const total = data.reduce((sum, slice) => sum + slice.value, 0);
    const hasData = data.length > 0 && total > 0;
    const size = 120;
    const stroke = 18;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;
    const arcs = hasData
        ? data.map((slice, index) => {
              const length = (slice.value / total) * circumference;
              const item = {
                  ...slice,
                  color: CHART_COLORS[index % CHART_COLORS.length],
                  dasharray: `${length} ${circumference - length}`,
                  dashoffset: -offset,
              };
              offset += length;
              return item;
          })
        : [];

    return (
        <View style={styles.donut}>
            <Text style={styles.donutTitle}>{title}</Text>
            {hasData ? (
                <>
                    <View style={styles.donutChartWrap}>
                        <Svg width={size} height={size}>
                            <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
                                {arcs.map((arc) => (
                                    <Circle
                                        key={arc.name}
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={arc.color}
                                        strokeWidth={stroke}
                                        fill="transparent"
                                        strokeDasharray={arc.dasharray}
                                        strokeDashoffset={arc.dashoffset}
                                        strokeLinecap="butt"
                                    />
                                ))}
                            </G>
                        </Svg>
                    </View>
                    <View style={styles.donutLegend}>
                        {arcs.map((arc) => (
                            <View key={arc.name} style={styles.donutLegendRow}>
                                <View
                                    style={[
                                        styles.donutDot,
                                        { backgroundColor: arc.color },
                                    ]}
                                />
                                <Text style={styles.donutLegendText}>
                                    {arc.name} ({arc.value})
                                </Text>
                            </View>
                        ))}
                    </View>
                </>
            ) : (
                <Text style={styles.hint}>{emptyLabel}</Text>
            )}
        </View>
    );
}

function FilterSelect({
    value,
    onChange,
    options,
    label,
}: {
    value: string | number;
    onChange: (v: any) => void;
    options: { value: string | number; label: string }[];
    label: string;
}) {
    return (
        <View style={styles.filterWrap}>
            <Text style={styles.filterLabel}>{label}</Text>
            <View style={styles.pickerWrap}>
                <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                >
                    {options.map((opt) => (
                        <Picker.Item
                            key={String(opt.value)}
                            label={opt.label}
                            value={opt.value}
                            color="#111"
                        />
                    ))}
                </Picker>
            </View>
        </View>
    );
}

/* ---------- Detail: code card ---------- */

export function AffiliateCodeCard({
    commissions,
    isLoading,
    promoCode,
    onOpenShare,
    onRequestGetCode,
    onOpenTerms,
}: {
    commissions: any;
    isLoading: boolean;
    promoCode: string | null;
    onOpenShare: () => void;
    onRequestGetCode: () => void;
    onOpenTerms: () => void;
}) {
    const navigation = useNavigation<any>();
    const totalEarnings = resolveTotalEarnings(commissions);

    if (promoCode) {
        return (
            <View style={styles.codeCard}>
                <View style={styles.codeHeading}>
                    <Icon name="card-giftcard" size={18} color="#ffc428" />
                    <Text style={styles.codeLabel}>Your Affiliate Code</Text>
                </View>
                <TouchableOpacity onPress={onOpenShare} activeOpacity={0.85}>
                    <Text style={styles.codeValue}>{promoCode}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareInlineBtn} onPress={onOpenShare}>
                    <FontAwesome name="share-alt" size={13} color="#fff" />
                    <Text style={styles.shareInlineText}>Click to share</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>
                    Share your code with friends and earn exciting rewards when
                    they join and play!
                </Text>
                <View style={styles.balanceRow}>
                    <Icon name="account-balance-wallet" size={18} color="#ffc428" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.balanceLabel}>Balance</Text>
                        <Text style={styles.balanceValue}>
                            {isLoading ? "…" : formatKes(totalEarnings)}{" "}
                            <Text
                                style={styles.withdrawLink}
                                onPress={() =>
                                    navigation.navigate("Sports", {
                                        screen: "WithdrawScreen",
                                    })
                                }
                            >
                                Withdraw
                            </Text>
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.shareInlineBtn} onPress={onOpenShare}>
                        <FontAwesome name="share-alt" size={12} color="#fff" />
                        <Text style={styles.shareInlineText}>Share / promote</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.nocodeCard}>
            <Text style={styles.nocodeHeading}>
                Join 20000+ others to earn with betmundial
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={onRequestGetCode}>
                <Icon name="add" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Get your affiliate code</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
                You earn and grow with betmundial through your network.
            </Text>
            <TouchableOpacity onPress={onOpenTerms}>
                <Text style={styles.link}>Terms</Text>
            </TouchableOpacity>
        </View>
    );
}

/* ---------- Detail: leaderboard + charts ---------- */

export function LeaderboardPanel({
    commissions,
    promoCode,
    onRequestGetCode,
}: {
    commissions: any;
    promoCode: string | null;
    onRequestGetCode: () => void;
}) {
    const [rows, setRows] = useState<any[]>([]);
    const [genderData, setGenderData] = useState<{ name: string; value: number }[]>(
        []
    );
    const [countyData, setCountyData] = useState<{ name: string; value: number }[]>(
        []
    );
    const [showFullCodes, setShowFullCodes] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shareOpen, setShareOpen] = useState(false);
    const [shareHint, setShareHint] = useState<string | null>(null);

    const applyStatsPayload = useCallback((payload: any) => {
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return { gender: [] as any[], county: [] as any[] };
        }
        const gender = pickGenderBreakdown(payload);
        const county = pickCountyBreakdown(payload);
        if (gender.length) setGenderData(gender);
        if (county.length) setCountyData(county);
        if (
            payload.show_full_codes === true ||
            payload.full_codes === true ||
            payload.redact_codes === false
        ) {
            setShowFullCodes(true);
        }
        return { gender, county };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const load = async () => {
            const [lbRes, statsRes] = await Promise.all([
                makeRequest({
                    url: LEADERBOARD_ENDPOINT,
                    method: "GET",
                    apiVersion: 2,
                }).catch(() => ({ status: 0, data: null })),
                makeRequest({
                    url: AFFILIATE_STATS_ENDPOINT,
                    method: "GET",
                    apiVersion: 2,
                }).catch(() => ({ status: 0, data: null })),
            ]);

            if (cancelled) return;

            const lbPayload = (lbRes.data as any)?.data ?? lbRes.data ?? null;
            let list = pickLeaderboardList(lbPayload);
            if (!list.length && Array.isArray(lbPayload)) list = lbPayload;

            if ((lbRes.status === 200 || lbRes.status === 201) && list.length) {
                setRows(list);
            } else {
                const fromCommissions = pickLeaderboardList(commissions);
                setRows(
                    fromCommissions.length ? fromCommissions : DUMMY_LEADERBOARD
                );
            }

            let hasGender = false;
            let hasCounty = false;
            const mergeStats = (payload: any) => {
                const { gender, county } = applyStatsPayload(payload);
                if (gender.length) hasGender = true;
                if (county.length) hasCounty = true;
            };
            mergeStats(lbPayload);
            if (statsRes.status === 200 || statsRes.status === 201) {
                mergeStats((statsRes.data as any)?.data ?? statsRes.data ?? null);
            }
            mergeStats(commissions);
            if (!hasGender) setGenderData(DUMMY_GENDER_BREAKDOWN);
            if (!hasCounty) setCountyData(DUMMY_COUNTY_BREAKDOWN);
            setLoading(false);
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [commissions, applyStatsPayload]);

    const ranked = useMemo(() => {
        return [...rows]
            .map((item, index) => {
                const rawCode = resolveLeaderboardCode(item);
                return {
                    item,
                    amount: resolveLeaderboardEarnings(item),
                    members: resolveLeaderboardMembers(item),
                    code: formatLeaderboardCode(rawCode, {
                        showFull: showFullCodes,
                    }),
                    codeKey: rawCode || `row-${index}`,
                };
            })
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 6);
    }, [rows, showFullCodes]);

    const handleMarketYourself = () => {
        setShareHint(null);
        if (!promoCode) {
            setShareOpen(false);
            onRequestGetCode();
            return;
        }
        setShareOpen((open) => !open);
    };

    const handleSocialShare = async (platform: string) => {
        if (!promoCode) return;
        const { hint } = await openAffiliateSocialShare(platform, promoCode);
        if (hint) setShareHint(hint);
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHead}>
                <Icon name="emoji-events" size={18} color="#ffc428" />
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Last month's leaders</Text>
                    <Text style={styles.hint}>
                        Top affiliate codes by earnings — plus member gender and
                        county mix.
                    </Text>
                </View>
            </View>

            <Text style={styles.subTitle}>Leaders</Text>
            <View style={styles.table}>
                <View style={styles.tableHead}>
                    <Text style={[styles.th, { flex: 1.4 }]}>Code</Text>
                    <Text style={[styles.th, { flex: 0.8 }]}>Members</Text>
                    <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                        Amount
                    </Text>
                </View>
                {loading ? (
                    <ActivityIndicator color={theme.accent} style={{ margin: 16 }} />
                ) : ranked.length === 0 ? (
                    <Text style={styles.emptyRow}>No leaderboard data yet</Text>
                ) : (
                    ranked.map(({ item, amount, members, code, codeKey }) => (
                        <View
                            key={item?.id ?? item?.user_id ?? codeKey}
                            style={styles.tableRow}
                        >
                            <Text style={[styles.tdCode, { flex: 1.4 }]} numberOfLines={1}>
                                {code}
                            </Text>
                            <Text style={[styles.td, { flex: 0.8 }]}>{members}</Text>
                            <Text
                                style={[
                                    styles.tdAmount,
                                    { flex: 1, textAlign: "right" },
                                ]}
                            >
                                {formatToFloat(amount ?? 0)}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.chartsRow}>
                <DonutChart
                    title="Gender comparison"
                    data={genderData}
                    emptyLabel="No gender data yet"
                />
                <DonutChart
                    title="County comparison"
                    data={countyData}
                    emptyLabel="No county data yet"
                />
            </View>

            <View style={styles.marketCard}>
                <Text style={styles.hint}>
                    There are many opportunities in your area.
                </Text>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleMarketYourself}
                >
                    <Text style={styles.primaryBtnText}>
                        {promoCode ? "Market yourself" : "Get started"}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.hint}>
                    {promoCode
                        ? "Share your affiliate code on WhatsApp, Facebook, X, or Instagram."
                        : "Get your affiliate code first, then share it with your network."}
                </Text>

                {promoCode && shareOpen ? (
                    <View style={styles.marketShare}>
                        <View style={styles.socialRow}>
                            {(
                                [
                                    ["whatsapp", "WhatsApp", "#25D366"],
                                    ["facebook", "Facebook", "#1877F2"],
                                    ["x", "X", "#fff"],
                                    ["instagram", "Instagram", "#E1306C"],
                                ] as const
                            ).map(([platform, label, color]) => (
                                <TouchableOpacity
                                    key={platform}
                                    style={styles.socialBtn}
                                    onPress={() => void handleSocialShare(platform)}
                                >
                                    <FontAwesome
                                        name={
                                            platform === "x"
                                                ? "twitter"
                                                : platform === "whatsapp"
                                                  ? "whatsapp"
                                                  : platform
                                        }
                                        size={16}
                                        color={color}
                                    />
                                    <Text style={styles.socialLabel}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.shareField}>
                            <Text style={styles.filterLabel}>Link</Text>
                            <View style={styles.shareFieldControl}>
                                <Text style={styles.shareFieldValue} numberOfLines={1}>
                                    {getAffiliateShareUrl(promoCode)}
                                </Text>
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={() => void handleSocialShare("copy")}
                                >
                                    <Text style={styles.copyBtnText}>Copy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.shareField}>
                            <Text style={styles.filterLabel}>Code</Text>
                            <View style={styles.shareFieldControl}>
                                <Text style={styles.shareFieldValue}>{promoCode}</Text>
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={() => void handleSocialShare("copy-code")}
                                >
                                    <Text style={styles.copyBtnText}>Copy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {shareHint ? (
                            <Text style={styles.successMsg}>{shareHint}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </View>
    );
}

export function HowItWorksSection({
    referrals,
    isLoading,
    onOpenShare,
    onOpenEarn,
    brief = false,
}: {
    referrals: number;
    isLoading: boolean;
    onOpenShare: () => void;
    onOpenEarn: () => void;
    brief?: boolean;
}) {
    if (brief) {
        return (
            <View style={styles.section}>
                <Text style={styles.hint}>{HOW_INTRO}</Text>
                <Text style={styles.sectionTitle}>How it works</Text>
                <Text style={styles.yellowLead}>As simple as abc</Text>
                {HOW_IT_WORKS.map((step) => (
                    <Text key={step.id} style={styles.hint}>
                        <Text style={styles.bold}>{step.title}</Text>
                        {" — "}
                        {step.description}
                    </Text>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.howHero}>
                <View>
                    <Text style={styles.balanceLabel}>Total Referrals</Text>
                    <Text style={styles.codeValue}>
                        {isLoading ? "…" : String(referrals)}
                    </Text>
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={onOpenShare}>
                    <FontAwesome name="share-alt" size={13} color="#fff" />
                    <Text style={styles.primaryBtnText}>Promote / Share</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{HOW_INTRO}</Text>
            {HOW_IT_WORKS.map((step) => {
                const isCta = step.id === "share" || step.id === "earn";
                return (
                    <View key={step.id} style={styles.stepRow}>
                        <View style={styles.stepIcon}>
                            <Icon name={step.icon} size={18} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            {isCta ? (
                                <TouchableOpacity
                                    onPress={
                                        step.id === "share" ? onOpenShare : onOpenEarn
                                    }
                                >
                                    <Text style={styles.stepTitleCta}>{step.title}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.stepTitle}>{step.title}</Text>
                            )}
                            <Text style={styles.hint}>{step.description}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export function TrustBar() {
    return (
        <TouchableOpacity
            style={styles.trustBar}
            onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
        >
            <Icon name="verified-user" size={18} color="#3dd68c" />
            <View style={{ flex: 1 }}>
                <Text style={styles.bold}>Trusted & Secure</Text>
                <Text style={styles.hint}>
                    Our platform is 100% secure and fair.
                </Text>
            </View>
            <Icon name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
    );
}

export function SupportFooter() {
    return (
        <TouchableOpacity
            style={styles.supportFooter}
            onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
        >
            <Icon name="headset-mic" size={16} color="#ffc428" />
            <Text style={styles.hint}>
                Need help? <Text style={styles.bold}>Contact Support &gt;</Text>
            </Text>
        </TouchableOpacity>
    );
}

/* ---------- Earnings tab ---------- */

export function EarningsPanel({
    commissions,
    isLoading,
    onOpenShare,
    promoCode,
}: {
    commissions: any;
    isLoading: boolean;
    onOpenShare: () => void;
    promoCode: string | null;
}) {
    const [period, setPeriod] = useState("this_month");

    const earnings = useMemo(() => {
        const list = pickList(commissions, [
            "latest_earnings",
            "earnings_list",
            "commissions",
            "transactions",
            "latest_wins",
            "wins",
            "recent_wins",
            "promo_wins",
            "affiliate_wins",
        ]);
        const source = list.length ? list : DUMMY_EARNINGS;
        return source.filter((item) =>
            isInPeriod(resolveEarningDate(item), period)
        );
    }, [commissions, period]);

    const overview = useMemo(() => {
        return {
            totalEarnings: pickNumber(
                commissions?.total_earnings,
                commissions?.affiliate_balance,
                commissions?.commission_balance,
                commissions?.commissions_balance,
                commissions?.total_commission,
                commissions?.earnings,
                commissions?.balance
            ),
            pendingEarnings: pickNumber(
                commissions?.pending_earnings,
                commissions?.pending,
                commissions?.pending_commission,
                commissions?.unpaid
            ),
            paidEarnings: pickNumber(
                commissions?.paid_earnings,
                commissions?.paid,
                commissions?.withdrawn,
                commissions?.paid_commission
            ),
            totalReferrals: resolveReferralCount(commissions),
        };
    }, [commissions]);

    if (isLoading && !commissions) {
        return (
            <View style={styles.loadingPanel}>
                <ActivityIndicator color={theme.accent} />
                <Text style={styles.hint}>Loading…</Text>
            </View>
        );
    }

    return (
        <View>
            <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { flex: 1 }]}>
                    Earnings Overview
                </Text>
                {promoCode ? (
                    <Text style={styles.codeChip}>{promoCode}</Text>
                ) : null}
                <TouchableOpacity style={styles.shareInlineBtn} onPress={onOpenShare}>
                    <FontAwesome name="share-alt" size={12} color="#fff" />
                    <Text style={styles.shareInlineText}>Share</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.overviewGrid}>
                <OverviewCard
                    label="Total Earnings"
                    value={formatKes(overview.totalEarnings)}
                    sub="All time"
                    icon="account-balance-wallet"
                    tone="pink"
                />
                <OverviewCard
                    label="Pending Earnings"
                    value={formatKes(overview.pendingEarnings)}
                    sub="Not yet paid"
                    icon="show-chart"
                    tone="yellow"
                />
                <OverviewCard
                    label="Paid Earnings"
                    value={formatKes(overview.paidEarnings)}
                    sub="Withdrawn"
                    icon="monetization-on"
                    tone="pink"
                />
                <OverviewCard
                    label="Total Referrals"
                    value={String(overview.totalReferrals)}
                    sub="All time"
                    icon="groups"
                    tone="yellow"
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHead}>
                    <Text style={[styles.sectionTitle, { flex: 1 }]}>
                        Latest Earnings
                    </Text>
                </View>
                <FilterSelect
                    label="Period"
                    value={period}
                    onChange={setPeriod}
                    options={PERIOD_OPTIONS}
                />
                <View style={styles.table}>
                    <View style={styles.tableHead}>
                        <Text style={[styles.th, { flex: 1.4 }]}>Date</Text>
                        <Text style={[styles.th, { flex: 0.8 }]}>Status</Text>
                        <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
                            Amount
                        </Text>
                    </View>
                    {earnings.length === 0 ? (
                        <Text style={styles.emptyRow}>
                            No earnings yet. Share your affiliate code to start
                            earning.
                        </Text>
                    ) : (
                        earnings.map((item, index) => {
                            const status = resolveEarningStatus(item);
                            return (
                                <View
                                    key={
                                        item?.id ??
                                        `${resolveEarningDate(item)}-${index}`
                                    }
                                    style={styles.tableRowCol}
                                >
                                    <View style={styles.tableRow}>
                                        <Text
                                            style={[styles.td, { flex: 1.4 }]}
                                            numberOfLines={2}
                                        >
                                            {formatDisplayDate(
                                                resolveEarningDate(item)
                                            )}
                                        </Text>
                                        <View style={{ flex: 0.8 }}>
                                            <StatusBadge status={status} />
                                        </View>
                                        <Text
                                            style={[
                                                styles.tdAmount,
                                                { flex: 1, textAlign: "right" },
                                            ]}
                                        >
                                            {formatKes(resolveEarningAmount(item))}
                                        </Text>
                                    </View>
                                    <Text style={styles.metaMuted}>
                                        {resolveEarningMonth(item)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>

            <View style={styles.payoutNote}>
                <Icon name="account-balance-wallet" size={16} color="#ffc428" />
                <Text style={[styles.hint, { flex: 1 }]}>
                    Payouts are processed every Monday. Minimum payout is KES 500.
                </Text>
                <TouchableOpacity
                    onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
                >
                    <Text style={styles.link}>Learn more &gt;</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/* ---------- Members tab ---------- */

export function MembersPanel({
    commissions,
    isLoading,
}: {
    commissions: any;
    isLoading: boolean;
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [period, setPeriod] = useState("this_month");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const members = useMemo(() => {
        const list = pickList(commissions, [
            "members",
            "referrals",
            "affiliate_members",
            "users",
        ]);
        if (list.length) return list;
        if (Array.isArray(commissions?.subscribers)) {
            return commissions.subscribers;
        }
        return [];
    }, [commissions]);

    const overview = useMemo(() => {
        const total = pickNumber(
            commissions?.total_members,
            commissions?.total_referrals,
            commissions?.subscriber_count,
            typeof commissions?.subscribers === "number"
                ? commissions.subscribers
                : null,
            members.length
        );
        let active = pickNumber(
            commissions?.active_members,
            commissions?.active
        );
        let inactive = pickNumber(
            commissions?.inactive_members,
            commissions?.inactive
        );
        if (!active && !inactive && members.length) {
            active = members.filter(
                (m) => resolveMemberStatus(m) === "active"
            ).length;
            inactive = members.filter(
                (m) => resolveMemberStatus(m) === "inactive"
            ).length;
        }
        return {
            total: total || members.length,
            active,
            inactive,
        };
    }, [commissions, members]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return members.filter((item, index) => {
            const status = resolveMemberStatus(item);
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (!isInPeriod(resolveJoinedAt(item), period)) return false;
            if (!q) return true;
            const name = resolveMemberName(item, index).toLowerCase();
            const phone = String(resolveMemberPhone(item) || "").toLowerCase();
            return name.includes(q) || phone.includes(q);
        });
    }, [members, search, statusFilter, period]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, period, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage) || 1);
    const currentPage = Math.min(page, totalPages);
    const start =
        filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, filtered.length);
    const pageItems = filtered.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    if (isLoading && !commissions) {
        return (
            <View style={styles.loadingPanel}>
                <ActivityIndicator color={theme.accent} />
                <Text style={styles.hint}>Loading…</Text>
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.sectionTitle}>Members Overview</Text>
            <View style={styles.overviewGrid}>
                <OverviewCard
                    label="Total Members"
                    value={String(overview.total)}
                    sub="All time"
                    icon="groups"
                    tone="pink"
                />
                <OverviewCard
                    label="Active Members"
                    value={String(overview.active)}
                    sub="Currently active"
                    icon="how-to-reg"
                    tone="yellow"
                />
                <OverviewCard
                    label="Inactive Members"
                    value={String(overview.inactive)}
                    sub="No activity yet"
                    icon="person-off"
                    tone="yellow"
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Members</Text>
                <View style={styles.searchWrap}>
                    <Icon name="search" size={16} color="rgba(255,255,255,0.5)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search members..."
                        placeholderTextColor="#94a3b8"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <FilterSelect
                    label="Status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={STATUS_OPTIONS}
                />
                <FilterSelect
                    label="Period"
                    value={period}
                    onChange={setPeriod}
                    options={PERIOD_OPTIONS}
                />

                <View style={styles.table}>
                    {pageItems.length === 0 ? (
                        <Text style={styles.emptyRow}>
                            {members.length === 0
                                ? "No members yet. Members who join with your affiliate code will appear here."
                                : "No members match your filters."}
                        </Text>
                    ) : (
                        pageItems.map((item, index) => {
                            const absoluteIndex =
                                (currentPage - 1) * rowsPerPage + index;
                            const name = resolveMemberName(item, absoluteIndex);
                            const phone = resolveMemberPhone(item);
                            const status = resolveMemberStatus(item);
                            const tone = avatarTone(absoluteIndex);
                            return (
                                <View
                                    key={
                                        item?.id ??
                                        `${name}-${resolveJoinedAt(item)}-${absoluteIndex}`
                                    }
                                    style={styles.memberRow}
                                >
                                    <View
                                        style={[
                                            styles.avatar,
                                            tone === "pink"
                                                ? styles.avatarPink
                                                : styles.avatarYellow,
                                        ]}
                                    >
                                        <Text style={styles.avatarText}>
                                            {getInitials(name)}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.memberName}>{name}</Text>
                                        {phone ? (
                                            <Text style={styles.metaMuted}>{phone}</Text>
                                        ) : null}
                                        <Text style={styles.metaMuted}>
                                            Joined{" "}
                                            {formatDisplayDate(resolveJoinedAt(item))}
                                        </Text>
                                    </View>
                                    <StatusBadge status={status} />
                                </View>
                            );
                        })
                    )}
                </View>

                <Text style={styles.paginationInfo}>
                    {filtered.length === 0
                        ? "Showing 0 members"
                        : `Showing ${start} to ${end} of ${filtered.length} members`}
                </Text>
                <View style={styles.paginationRow}>
                    <TouchableOpacity
                        style={[
                            styles.pageBtn,
                            currentPage <= 1 && styles.pageBtnDisabled,
                        ]}
                        disabled={currentPage <= 1}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        <Icon name="chevron-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.pageNum}>
                        {currentPage} / {totalPages}
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.pageBtn,
                            currentPage >= totalPages && styles.pageBtnDisabled,
                        ]}
                        disabled={currentPage >= totalPages}
                        onPress={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                    >
                        <Icon name="chevron-right" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <FilterSelect
                    label="Rows per page"
                    value={rowsPerPage}
                    onChange={(v) => setRowsPerPage(Number(v))}
                    options={ROWS_PER_PAGE_OPTIONS.map((n) => ({
                        value: n,
                        label: String(n),
                    }))}
                />
            </View>
        </View>
    );
}

/** Re-export get-code modal trigger helper type usage */
export { AffiliateGetCodeModal };

const styles = StyleSheet.create({
    section: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    sectionHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 8,
    },
    subTitle: {
        color: "rgba(255,255,255,0.85)",
        fontWeight: "700",
        fontSize: 13,
        marginBottom: 8,
    },
    hint: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 6,
    },
    bold: { color: "#fff", fontWeight: "700" },
    yellowLead: {
        color: "#ffc428",
        fontWeight: "700",
        marginBottom: 8,
    },
    link: {
        color: theme.accent,
        fontWeight: "700",
        marginTop: 6,
    },
    codeCard: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    codeHeading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    codeLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
    codeValue: {
        color: "#ffc428",
        fontSize: 26,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 8,
    },
    codeChip: {
        color: "#ffc428",
        fontWeight: "700",
        fontSize: 12,
        marginRight: 6,
    },
    shareInlineBtn: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: theme.accent,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
    },
    shareInlineText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    balanceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    balanceLabel: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 12,
        fontWeight: "600",
    },
    balanceValue: {
        color: "#ffc428",
        fontSize: 18,
        fontWeight: "800",
    },
    withdrawLink: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
    nocodeCard: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        alignItems: "center",
    },
    nocodeHeading: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 14,
    },
    primaryBtn: {
        backgroundColor: theme.accent,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        marginBottom: 10,
        alignSelf: "stretch",
    },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    table: {
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "rgba(0,0,0,0.2)",
        marginBottom: 12,
    },
    tableHead: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    th: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    tableRowCol: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.08)",
        paddingBottom: 6,
    },
    td: { color: "#fff", fontSize: 12 },
    tdCode: { color: "#ffc428", fontSize: 12, fontWeight: "700" },
    tdAmount: { color: "#fff", fontSize: 12, fontWeight: "700" },
    emptyRow: {
        color: "rgba(255,255,255,0.55)",
        padding: 14,
        textAlign: "center",
        fontSize: 13,
    },
    chartsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 12,
    },
    donut: {
        flexGrow: 1,
        flexBasis: "46%",
        backgroundColor: "rgba(0,0,0,0.18)",
        borderRadius: 10,
        padding: 10,
        minWidth: 140,
    },
    donutTitle: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
        marginBottom: 8,
        textAlign: "center",
    },
    donutChartWrap: { alignItems: "center", marginBottom: 8 },
    donutLegend: { gap: 4 },
    donutLegendRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    donutDot: { width: 8, height: 8, borderRadius: 4 },
    donutLegendText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 11,
    },
    marketCard: {
        backgroundColor: "rgba(167,31,102,0.15)",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(167,31,102,0.35)",
    },
    marketShare: { marginTop: 8 },
    socialRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
    },
    socialBtn: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    socialLabel: { color: "#fff", fontWeight: "600", fontSize: 12 },
    shareField: { marginBottom: 10 },
    shareFieldControl: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 8,
        paddingLeft: 10,
        paddingVertical: 4,
    },
    shareFieldValue: { flex: 1, color: "#fff", fontSize: 12 },
    copyBtn: {
        backgroundColor: theme.accent,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    copyBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    successMsg: { color: "#86efac", fontSize: 12, marginTop: 4 },
    howHero: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
    },
    stepRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
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
    stepTitleCta: {
        color: "#ffc428",
        fontWeight: "800",
        marginBottom: 2,
        textDecorationLine: "underline",
    },
    trustBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(61,214,140,0.12)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(61,214,140,0.25)",
    },
    supportFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        justifyContent: "center",
        paddingVertical: 16,
    },
    overviewGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },
    overviewCard: {
        width: "48%",
        flexGrow: 1,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        minWidth: 140,
    },
    overviewCardPink: {
        backgroundColor: "rgba(167,31,102,0.18)",
        borderColor: "rgba(167,31,102,0.35)",
    },
    overviewCardYellow: {
        backgroundColor: "rgba(255,196,40,0.12)",
        borderColor: "rgba(255,196,40,0.28)",
    },
    overviewIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    overviewIconPink: { backgroundColor: theme.accent },
    overviewIconYellow: { backgroundColor: "#c99700" },
    overviewLabel: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 4,
    },
    overviewValue: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 2,
    },
    overviewSub: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
    },
    filterWrap: { marginBottom: 10 },
    filterLabel: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 4,
    },
    pickerWrap: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    picker: {
        color: "#fff",
        height: 44,
    },
    badge: {
        alignSelf: "flex-start",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeOk: { backgroundColor: "rgba(61,214,140,0.25)" },
    badgePending: { backgroundColor: "rgba(255,196,40,0.25)" },
    badgeInactive: { backgroundColor: "rgba(255,255,255,0.12)" },
    badgeNeutral: { backgroundColor: "rgba(255,255,255,0.1)" },
    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "capitalize",
    },
    payoutNote: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    searchInput: {
        flex: 1,
        color: "#fff",
        paddingVertical: 10,
        fontSize: 14,
    },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarPink: { backgroundColor: theme.accent },
    avatarYellow: { backgroundColor: "#c99700" },
    avatarText: { color: "#fff", fontWeight: "800", fontSize: 12 },
    memberName: { color: "#fff", fontWeight: "700", fontSize: 13 },
    metaMuted: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 11,
        marginTop: 2,
    },
    paginationInfo: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
        marginBottom: 8,
        textAlign: "center",
    },
    paginationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 10,
    },
    pageBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    pageBtnDisabled: { opacity: 0.35 },
    pageNum: { color: "#fff", fontWeight: "700" },
    loadingPanel: {
        padding: 40,
        alignItems: "center",
        gap: 10,
    },
});
