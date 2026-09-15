/** Shared affiliate resolve/pick helpers — mirrored from betmundial-web promo-wins. */

export const HOW_IT_WORKS = [
    {
        id: "create",
        title: "Create",
        description: "Create your unique affiliate code.",
        icon: "edit" as const,
    },
    {
        id: "share",
        title: "Share",
        description: "Share with friends and your network.",
        icon: "share" as const,
    },
    {
        id: "earn",
        title: "Earn",
        description: "Your friends play, you earn rewards.",
        icon: "card-giftcard" as const,
    },
];

export const HOW_INTRO =
    "20000+ fans already earn with Betmundial. Share your code — they play, you win.";

export const PERIOD_OPTIONS = [
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "all_time", label: "All Time" },
];

export const STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "inactive", label: "Inactive" },
];

export const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export const SUPPORT_EMAIL = "mailto:customercare@betmundial.com";

export const LEADERBOARD_ENDPOINT =
    "/user/affiliate/leaderboard?period=last_month";
export const AFFILIATE_STATS_ENDPOINT = "/user/affiliate/stats";
export const COMMISSIONS_ENDPOINT = "/user/commissions";

export const CHART_COLORS = [
    "#e91e8c",
    "#ffc428",
    "#a71f66",
    "#3dd68c",
    "#ff52d4",
    "#5b8def",
    "#ff8fab",
    "#7dffb3",
];

export const DUMMY_LEADERBOARD = [
    { code: "moses-tembula", members: 842, last_month_earnings: 186450 },
    { code: "BETKAREN", members: 619, last_month_earnings: 142800 },
    { code: "wanjiku-ke", members: 504, last_month_earnings: 98750 },
    { code: "BETOTIENO", members: 387, last_month_earnings: 76420 },
    { code: "njeri-mombasa", members: 298, last_month_earnings: 54100 },
    { code: "BETKAMAU", members: 215, last_month_earnings: 38950 },
];

export const DUMMY_GENDER_BREAKDOWN = [
    { name: "Male", value: 58 },
    { name: "Female", value: 42 },
];

export const DUMMY_COUNTY_BREAKDOWN = [
    { name: "Nairobi", value: 34 },
    { name: "Mombasa", value: 18 },
    { name: "Kisumu", value: 14 },
    { name: "Nakuru", value: 12 },
    { name: "Kiambu", value: 10 },
];

export const DUMMY_EARNINGS = [
    {
        id: "earn-1",
        created_at: "2026-09-05T09:15:00",
        status: "paid",
        amount: 2450,
        month: "Sep 2026",
    },
    {
        id: "earn-2",
        created_at: "2026-09-04T14:32:00",
        status: "pending",
        amount: 875,
        month: "Sep 2026",
    },
    {
        id: "earn-3",
        created_at: "2026-09-03T11:08:00",
        status: "paid",
        amount: 3120,
        month: "Sep 2026",
    },
    {
        id: "earn-4",
        created_at: "2026-09-02T16:45:00",
        status: "paid",
        amount: 1580,
        month: "Sep 2026",
    },
    {
        id: "earn-5",
        created_at: "2026-09-01T10:20:00",
        status: "pending",
        amount: 640,
        month: "Sep 2026",
    },
    {
        id: "earn-6",
        created_at: "2026-09-01T08:05:00",
        status: "paid",
        amount: 4210,
        month: "Sep 2026",
    },
];

export const AFFILIATE_TERMS = [
    {
        title: "Eligibility",
        body: "The Betmundial Affiliate Program is open to registered Betmundial account holders who are of legal gambling age in their jurisdiction. Betmundial reserves the right to approve or decline affiliate participation at its discretion.",
    },
    {
        title: "Your affiliate code",
        body: "Each approved participant may generate one unique affiliate code. You are responsible for how your code is shared. Codes must not be used in misleading, spam, or fraudulent promotions.",
    },
    {
        title: "Earnings & payouts",
        body: "Commissions are calculated on eligible referred activity as defined by Betmundial. Payouts are subject to minimum thresholds, verification checks, and applicable schedules. Betmundial may adjust or withhold earnings linked to abuse, self-referrals, or suspicious activity.",
    },
    {
        title: "Prohibited conduct",
        body: "You may not create fake accounts, incentivize registrations with unauthorized offers, misrepresent Betmundial, target minors, or use paid brand bidding without written approval. Violations may result in code suspension and forfeiture of unpaid earnings.",
    },
    {
        title: "Changes & termination",
        body: "Betmundial may update these terms, commission rates, or program rules at any time. Continued participation after changes constitutes acceptance. Either party may end affiliate participation; unpaid eligible earnings remain subject to verification.",
    },
];

const MONTH_SHORT = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export function pickList(source: any, keys: string[]): any[] {
    if (!source) return [];
    for (const key of keys) {
        const value = source[key];
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.data)) return value.data;
        if (Array.isArray(value?.items)) return value.items;
    }
    return [];
}

export function pickNumber(...candidates: any[]): number {
    for (const value of candidates) {
        if (value == null || value === "") continue;
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

export function resolveReferralCount(commissions: any): number {
    if (!commissions) return 0;
    const raw =
        commissions.total_referrals ??
        commissions.subscriber_count ??
        (typeof commissions.subscribers === "number"
            ? commissions.subscribers
            : null) ??
        (Array.isArray(commissions.subscribers)
            ? commissions.subscribers.length
            : null) ??
        (Array.isArray(commissions.referrals)
            ? commissions.referrals.length
            : null) ??
        (Array.isArray(commissions.members)
            ? commissions.members.length
            : null);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

export function resolveTotalEarnings(commissions: any): number {
    if (!commissions) return 0;
    return pickNumber(
        commissions.total_earnings,
        commissions.affiliate_balance,
        commissions.commission_balance,
        commissions.commissions_balance,
        commissions.total_commission,
        commissions.earnings,
        commissions.balance
    );
}

export function formatDisplayDate(value: any): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = MONTH_SHORT[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, "0");
    return `${day} ${month}, ${year} ${hourStr}:${minutes} ${ampm}`;
}

export function getInitials(name: string): string {
    if (!name) return "?";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function avatarTone(index: number): "pink" | "yellow" {
    return index % 2 === 0 ? "pink" : "yellow";
}

export function resolveMemberName(item: any, index: number): string {
    return (
        item?.full_name ||
        item?.username ||
        item?.user_name ||
        item?.name ||
        item?.msisdn ||
        item?.phone ||
        item?.mobile ||
        `Member #${index + 1}`
    );
}

export function resolveMemberPhone(item: any): string | null {
    return (
        item?.msisdn ||
        item?.phone ||
        item?.mobile ||
        item?.phone_number ||
        null
    );
}

export function resolveMemberStatus(item: any): string {
    const raw = String(
        item?.status || item?.member_status || item?.state || ""
    ).toLowerCase();
    if (raw.includes("active")) return "active";
    if (raw.includes("pending") || raw.includes("await")) return "pending";
    if (raw.includes("inactive") || raw.includes("dormant")) return "inactive";
    if (item?.first_activity || item?.first_bet_at || item?.last_activity) {
        return "active";
    }
    return "pending";
}

export function resolveJoinedAt(item: any): string | null {
    return (
        item?.joined_at ||
        item?.created_at ||
        item?.registered_at ||
        item?.date ||
        null
    );
}

export function resolveEarningDate(item: any): string | null {
    return (
        item?.created_at ||
        item?.date ||
        item?.earned_at ||
        item?.paid_at ||
        item?.updated_at ||
        null
    );
}

export function resolveLeaderboardEarnings(item: any): number {
    return pickNumber(
        item?.last_month_earnings,
        item?.last_month_amount,
        item?.earnings,
        item?.amount,
        item?.total_earnings,
        item?.commission,
        item?.commission_amount,
        item?.balance
    );
}

export function resolveLeaderboardMembers(item: any): number {
    return pickNumber(
        item?.members,
        item?.member_count,
        item?.members_count,
        item?.total_members,
        item?.subscriber_count,
        item?.subscribers,
        item?.referrals,
        item?.referral_count,
        item?.total_referrals
    );
}

export function resolveLeaderboardCode(item: any): string | null {
    const raw =
        item?.redacted_code ||
        item?.display_code ||
        item?.masked_code ||
        item?.promo_code ||
        item?.affiliate_code ||
        item?.code ||
        item?.username ||
        item?.user_name ||
        null;
    if (raw == null || raw === "") return null;
    return String(raw);
}

export function formatLeaderboardCode(
    code: string | null,
    { showFull = false }: { showFull?: boolean } = {}
): string {
    if (!code) return "—";
    const s = String(code).trim();
    if (!s) return "—";
    if (showFull || s.includes("*")) return s;
    if (s.length <= 3) return `${s[0]}***`;
    if (s.length <= 5) return `${s.slice(0, 1)}***${s.slice(-1)}`;
    const start = Math.min(3, Math.max(2, Math.floor(s.length / 3)));
    const end = Math.min(3, Math.max(2, Math.floor(s.length / 3)));
    return `${s.slice(0, start)}***${s.slice(-end)}`;
}

export function pickLeaderboardList(source: any): any[] {
    return pickList(source, [
        "leaderboard",
        "top_earners",
        "top_affiliates",
        "affiliate_leaderboard",
        "last_month_earners",
        "last_month_leaderboard",
        "rankings",
    ]);
}

function normalizeBreakdown(
    source: any,
    keys: string[]
): { name: string; value: number }[] {
    if (!source) return [];

    for (const key of keys) {
        const value = source[key];
        if (!value) continue;

        if (Array.isArray(value)) {
            return value
                .map((item) => {
                    if (item == null || typeof item !== "object") return null;
                    const name =
                        item.name ||
                        item.label ||
                        item.gender ||
                        item.county ||
                        item.key ||
                        item.category ||
                        null;
                    const amount = pickNumber(
                        item.value,
                        item.count,
                        item.total,
                        item.members,
                        item.amount,
                        item.percentage
                    );
                    if (!name || amount <= 0) return null;
                    return { name: String(name), value: amount };
                })
                .filter(Boolean) as { name: string; value: number }[];
        }

        if (typeof value === "object") {
            return Object.entries(value)
                .map(([name, raw]) => {
                    const amount =
                        typeof raw === "object" && raw != null
                            ? pickNumber(
                                  (raw as any).value,
                                  (raw as any).count,
                                  (raw as any).total,
                                  (raw as any).members,
                                  (raw as any).amount
                              )
                            : pickNumber(raw);
                    if (!name || amount <= 0) return null;
                    return { name: String(name), value: amount };
                })
                .filter(Boolean) as { name: string; value: number }[];
        }
    }

    return [];
}

export function pickGenderBreakdown(source: any) {
    return normalizeBreakdown(source, [
        "gender",
        "gender_breakdown",
        "gender_comparison",
        "gender_stats",
        "genders",
        "by_gender",
    ]);
}

export function pickCountyBreakdown(source: any) {
    return normalizeBreakdown(source, [
        "county",
        "county_breakdown",
        "county_comparison",
        "county_stats",
        "counties",
        "by_county",
        "region_breakdown",
        "regions",
    ]);
}

export function resolveEarningStatus(item: any): string {
    const raw = String(item?.status || item?.payment_status || "").toLowerCase();
    if (
        raw.includes("paid") ||
        raw.includes("withdrawn") ||
        raw.includes("complete")
    ) {
        return "paid";
    }
    if (raw.includes("pending") || raw.includes("process")) {
        return "pending";
    }
    return item?.paid_at ? "paid" : "pending";
}

export function resolveEarningAmount(item: any): number {
    return pickNumber(
        item?.amount,
        item?.commission,
        item?.earned,
        item?.earnings,
        item?.win_amount,
        item?.payout
    );
}

export function resolveEarningMonth(item: any): string {
    if (item?.month) return String(item.month);
    const dateValue = resolveEarningDate(item);
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return `${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function isInPeriod(dateValue: any, period: string): boolean {
    if (period === "all_time" || !dateValue) return true;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return true;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (period === "this_month") {
        return date.getFullYear() === year && date.getMonth() === month;
    }
    if (period === "last_month") {
        const last = new Date(year, month - 1, 1);
        return (
            date.getFullYear() === last.getFullYear() &&
            date.getMonth() === last.getMonth()
        );
    }
    return true;
}
