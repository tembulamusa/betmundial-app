import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Context } from "../../context/store";
import { makeRequest } from "../utils/makeRequest";
import { normalizeUser, setItem } from "../utils/local-storage";
import { theme } from "../../theme";
import {
    getAffiliateShareUrl,
    openAffiliateSocialShare,
} from "./affiliateShare";
import { AFFILIATE_TERMS } from "./affiliateHelpers";

const CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,31}$/;
const CHECK_DEBOUNCE_MS = 450;

function normalizeSuggestedCode(value: string) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function parseAvailability(status: number, response: any) {
    if (status === 404 || status === 410 || status === 409) {
        return { state: "taken", text: "This code is already taken." };
    }
    if (status === 400 || status === 422) {
        return {
            state: "invalid",
            text:
                response?.message ||
                response?.error ||
                "This code is invalid.",
        };
    }
    if (status !== 200 && status !== 201) {
        return {
            state: "error",
            text:
                response?.message ||
                response?.error ||
                "Unable to check availability.",
        };
    }

    const data = response?.data ?? response ?? {};
    const available =
        data.available ??
        data.is_available ??
        data.isAvailable ??
        (typeof data.exists === "boolean" ? !data.exists : undefined) ??
        (typeof data.taken === "boolean" ? !data.taken : undefined) ??
        (typeof data.in_use === "boolean" ? !data.in_use : undefined);

    if (available === true) {
        return { state: "available", text: "Code is available." };
    }
    if (available === false) {
        const msg = String(data.message || data.error || "").toLowerCase();
        if (msg.includes("invalid")) {
            return {
                state: "invalid",
                text: data.message || data.error || "This code is invalid.",
            };
        }
        return {
            state: "taken",
            text: data.message || data.error || "This code is already taken.",
        };
    }

    const msg = String(
        data.message || data.error || data.status || ""
    ).toLowerCase();
    if (msg.includes("available") && !msg.includes("not")) {
        return { state: "available", text: "Code is available." };
    }
    if (
        msg.includes("taken") ||
        msg.includes("exists") ||
        msg.includes("in use") ||
        msg.includes("already")
    ) {
        return {
            state: "taken",
            text: data.message || data.error || "This code is already taken.",
        };
    }
    if (msg.includes("invalid")) {
        return {
            state: "invalid",
            text: data.message || data.error || "This code is invalid.",
        };
    }

    return { state: "available", text: "Code is available." };
}

type GetCodeProps = {
    show: boolean;
    onHide: () => void;
    onCreated?: (code: string) => void;
};

export function AffiliateGetCodeModal({
    show,
    onHide,
    onCreated,
}: GetCodeProps) {
    const [state, dispatch] = useContext(Context);
    const user = state?.user;
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(
        null
    );
    const [createMode, setCreateMode] = useState<"custom" | "auto">("custom");
    const [customCode, setCustomCode] = useState("");
    const [availability, setAvailability] = useState({
        state: "idle",
        text: "",
    });
    const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const checkSeqRef = useRef(0);

    const resetCustomizeForm = useCallback(() => {
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        checkSeqRef.current += 1;
        setCreateMode("custom");
        setCustomCode("");
        setAvailability({ state: "idle", text: "" });
        setMessage(null);
    }, []);

    useEffect(() => {
        if (!show) return;
        resetCustomizeForm();
    }, [show, resetCustomizeForm]);

    useEffect(() => {
        return () => {
            if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        };
    }, []);

    const persistPromoCode = async (code: string) => {
        const nextUser = normalizeUser({ ...(user || {}), promo_code: code });
        await setItem("user", nextUser);
        dispatch({ type: "SET", key: "user", payload: nextUser });
    };

    const closeCustomizeForm = () => {
        if (generating) return;
        onHide();
        resetCustomizeForm();
    };

    const runAvailabilityCheck = (rawValue: string) => {
        const code = normalizeSuggestedCode(rawValue);
        const seq = ++checkSeqRef.current;

        if (!code) {
            setAvailability({ state: "idle", text: "" });
            return;
        }
        if (!CODE_PATTERN.test(code)) {
            setAvailability({
                state: "invalid",
                text: "Use 3–32 characters: letters, numbers, - or _.",
            });
            return;
        }

        setAvailability({ state: "checking", text: "Checking availability…" });

        void makeRequest({
            url: `/user/promo-code/check?code=${encodeURIComponent(code)}`,
            method: "GET",
            apiVersion: 2,
        }).then((res) => {
            if (seq !== checkSeqRef.current) return;
            setAvailability(parseAvailability(res.status, res.data));
        });
    };

    const scheduleAvailabilityCheck = (value: string) => {
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        checkSeqRef.current += 1;

        const code = normalizeSuggestedCode(value);
        if (!code) {
            setAvailability({ state: "idle", text: "" });
            return;
        }

        setAvailability({ state: "checking", text: "Checking availability…" });
        checkTimerRef.current = setTimeout(() => {
            runAvailabilityCheck(value);
        }, CHECK_DEBOUNCE_MS);
    };

    const switchCreateMode = (mode: "custom" | "auto") => {
        if (generating || mode === createMode) return;
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        checkSeqRef.current += 1;
        setCreateMode(mode);
        setMessage(null);
        if (mode === "custom" && customCode) {
            scheduleAvailabilityCheck(customCode);
        } else {
            setAvailability({ state: "idle", text: "" });
        }
    };

    const canGenerateCustom =
        Boolean(normalizeSuggestedCode(customCode)) &&
        availability.state === "available" &&
        !generating;
    const canGenerate =
        createMode === "auto" ? !generating : canGenerateCustom;

    const handleCreatePromo = async () => {
        if (!canGenerate) return;

        const isAuto = createMode === "auto";
        const code = isAuto ? null : normalizeSuggestedCode(customCode);
        setGenerating(true);
        setMessage(null);

        const res = await makeRequest({
            url: "/user/promo-code",
            method: "POST",
            apiVersion: 2,
            data: !isAuto && code ? { promo_code: code, code } : undefined,
        });
        setGenerating(false);

        const body: any = res.data;
        const created =
            body?.promo_code ||
            body?.data?.promo_code ||
            body?.code ||
            body?.data?.code ||
            code;

        if ((res.status === 200 || res.status === 201) && created) {
            await persistPromoCode(String(created));
            onCreated?.(String(created));
            onHide();
            resetCustomizeForm();
            return;
        }

        setMessage({
            type: "error",
            text:
                body?.message ||
                body?.error ||
                res.error ||
                "Unable to create affiliate code. Please try again.",
        });

        const errText = String(body?.message || body?.error || "").toLowerCase();
        if (
            !isAuto &&
            (res.status === 409 ||
                errText.includes("taken") ||
                errText.includes("exists"))
        ) {
            setAvailability({
                state: "taken",
                text: "This code is already taken.",
            });
        }
    };

    return (
        <Modal visible={show} transparent animationType="fade" onRequestClose={closeCustomizeForm}>
            <Pressable style={modalStyles.overlay} onPress={closeCustomizeForm}>
                <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Get your affiliate code</Text>
                        <TouchableOpacity onPress={closeCustomizeForm} hitSlop={8}>
                            <FontAwesome name="times" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={modalStyles.modeRow}>
                        <TouchableOpacity
                            style={[
                                modalStyles.modeBtn,
                                createMode === "custom" && modalStyles.modeBtnActive,
                            ]}
                            onPress={() => switchCreateMode("custom")}
                            disabled={generating}
                        >
                            <Text
                                style={[
                                    modalStyles.modeBtnText,
                                    createMode === "custom" &&
                                        modalStyles.modeBtnTextActive,
                                ]}
                            >
                                Custom
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                modalStyles.modeBtn,
                                createMode === "auto" && modalStyles.modeBtnActive,
                            ]}
                            onPress={() => switchCreateMode("auto")}
                            disabled={generating}
                        >
                            <Text
                                style={[
                                    modalStyles.modeBtnText,
                                    createMode === "auto" &&
                                        modalStyles.modeBtnTextActive,
                                ]}
                            >
                                Autogenerate
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {createMode === "custom" ? (
                        <>
                            <Text style={modalStyles.label}>Customize code</Text>
                            <TextInput
                                style={[
                                    modalStyles.input,
                                    (availability.state === "taken" ||
                                        availability.state === "invalid") &&
                                        modalStyles.inputError,
                                    availability.state === "available" &&
                                        modalStyles.inputOk,
                                ]}
                                placeholder="moses-tembula"
                                placeholderTextColor="#94a3b8"
                                value={customCode}
                                autoCapitalize="none"
                                autoCorrect={false}
                                maxLength={32}
                                editable={!generating}
                                onChangeText={(next) => {
                                    setCustomCode(next);
                                    setMessage(null);
                                    scheduleAvailabilityCheck(next);
                                }}
                                onBlur={() => {
                                    if (checkTimerRef.current) {
                                        clearTimeout(checkTimerRef.current);
                                    }
                                    runAvailabilityCheck(customCode);
                                }}
                            />
                            <Text
                                style={[
                                    modalStyles.hint,
                                    availability.state === "available" &&
                                        modalStyles.hintOk,
                                    (availability.state === "taken" ||
                                        availability.state === "invalid" ||
                                        availability.state === "error") &&
                                        modalStyles.hintError,
                                ]}
                            >
                                {availability.text ||
                                    "Pick a unique code friends will remember."}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={modalStyles.hint}>
                                We'll create a unique affiliate code for you
                                automatically. You can share it right away once
                                it's ready.
                            </Text>
                            <Text style={modalStyles.notice}>
                                Once generated, you won't be able to update your
                                code. We recommend creating a custom code
                                instead.
                            </Text>
                        </>
                    )}

                    {message?.text ? (
                        <Text
                            style={
                                message.type === "error"
                                    ? modalStyles.hintError
                                    : modalStyles.hintOk
                            }
                        >
                            {message.text}
                        </Text>
                    ) : null}

                    <View style={modalStyles.footer}>
                        <TouchableOpacity
                            style={modalStyles.cancelBtn}
                            onPress={closeCustomizeForm}
                            disabled={generating}
                        >
                            <Text style={modalStyles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                modalStyles.primaryBtn,
                                !canGenerate && modalStyles.primaryBtnDisabled,
                            ]}
                            onPress={() => void handleCreatePromo()}
                            disabled={!canGenerate}
                        >
                            {generating ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={modalStyles.primaryBtnText}>
                                    {createMode === "auto" ? "Generate" : "Submit"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

type ShareProps = {
    show: boolean;
    onHide: () => void;
    promoCode?: string | null;
};

export function AffiliateShareModal({ show, onHide, promoCode }: ShareProps) {
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState<{ type: string; text: string } | null>(
        null
    );

    useEffect(() => {
        if (!show) {
            setCopied(false);
            setMessage(null);
        }
    }, [show]);

    const handleSocialShare = async (platform: string) => {
        if (!promoCode) return;
        const { ok, hint } = await openAffiliateSocialShare(platform, promoCode);
        if (!hint) return;
        setMessage({ type: ok ? "success" : "error", text: hint });
        if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    if (!promoCode) return null;

    return (
        <Modal visible={show} transparent animationType="fade" onRequestClose={onHide}>
            <Pressable style={modalStyles.overlay} onPress={onHide}>
                <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Share your affiliate code</Text>
                        <TouchableOpacity onPress={onHide} hitSlop={8}>
                            <FontAwesome name="times" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={modalStyles.hint}>
                        Share <Text style={modalStyles.bold}>{promoCode}</Text> on
                        social media
                    </Text>

                    <View style={modalStyles.socialRow}>
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
                                style={modalStyles.socialBtn}
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
                                    size={18}
                                    color={color}
                                />
                                <Text style={modalStyles.socialLabel}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={modalStyles.shareField}>
                        <Text style={modalStyles.label}>Link</Text>
                        <View style={modalStyles.shareFieldControl}>
                            <Text style={modalStyles.shareFieldValue} numberOfLines={1}>
                                {getAffiliateShareUrl(promoCode)}
                            </Text>
                            <TouchableOpacity
                                style={modalStyles.copyBtn}
                                onPress={() => void handleSocialShare("copy")}
                            >
                                <Text style={modalStyles.copyBtnText}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={modalStyles.shareField}>
                        <Text style={modalStyles.label}>Code</Text>
                        <View style={modalStyles.shareFieldControl}>
                            <Text style={modalStyles.shareFieldValue}>{promoCode}</Text>
                            <TouchableOpacity
                                style={modalStyles.copyBtn}
                                onPress={() => void handleSocialShare("copy-code")}
                            >
                                <Text style={modalStyles.copyBtnText}>Copy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {message?.text ? (
                        <Text
                            style={
                                message.type === "error"
                                    ? modalStyles.hintError
                                    : modalStyles.hintOk
                            }
                        >
                            {message.text}
                        </Text>
                    ) : copied ? (
                        <Text style={modalStyles.hintOk}>Copied!</Text>
                    ) : null}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

type EarnProps = {
    show: boolean;
    onHide: () => void;
    onOpenShare: () => void;
    onOpenEarnings?: () => void;
    onOpenTerms?: () => void;
};

export function AffiliateEarnModal({
    show,
    onHide,
    onOpenShare,
    onOpenEarnings,
    onOpenTerms,
}: EarnProps) {
    return (
        <Modal visible={show} transparent animationType="fade" onRequestClose={onHide}>
            <Pressable style={modalStyles.overlay} onPress={onHide}>
                <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>How you earn</Text>
                        <TouchableOpacity onPress={onHide} hitSlop={8}>
                            <FontAwesome name="times" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={modalStyles.hint}>
                        Friends register with your affiliate code, play on
                        Betmundial, and you earn rewards and commissions on their
                        activity.
                    </Text>
                    <Text style={modalStyles.hint}>
                        Share your code, grow your network, and get paid as they
                        play. The more they bet, the more you earn.
                    </Text>
                    <Text style={modalStyles.notice}>
                        Payouts follow the affiliate program schedule. See Terms
                        for details.
                    </Text>
                    <TouchableOpacity
                        style={modalStyles.primaryBtn}
                        onPress={() => {
                            onHide();
                            onOpenShare();
                        }}
                    >
                        <Text style={modalStyles.primaryBtnText}>
                            Share your code
                        </Text>
                    </TouchableOpacity>
                    <View style={modalStyles.earnLinks}>
                        {onOpenTerms ? (
                            <TouchableOpacity
                                onPress={() => {
                                    onHide();
                                    onOpenTerms();
                                }}
                            >
                                <Text style={modalStyles.earnLink}>View terms</Text>
                            </TouchableOpacity>
                        ) : null}
                        {onOpenEarnings ? (
                            <TouchableOpacity
                                onPress={() => {
                                    onHide();
                                    onOpenEarnings();
                                }}
                            >
                                <Text style={modalStyles.earnLink}>My Earnings</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                    <TouchableOpacity style={modalStyles.cancelBtn} onPress={onHide}>
                        <Text style={modalStyles.cancelText}>Got it</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

type TermsProps = {
    show: boolean;
    onHide: () => void;
};

export function AffiliateTermsModal({ show, onHide }: TermsProps) {
    return (
        <Modal visible={show} transparent animationType="fade" onRequestClose={onHide}>
            <Pressable style={modalStyles.overlay} onPress={onHide}>
                <Pressable
                    style={[modalStyles.card, modalStyles.termsCard]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>
                            Affiliate Terms & Conditions
                        </Text>
                        <TouchableOpacity onPress={onHide} hitSlop={8}>
                            <FontAwesome name="times" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={modalStyles.termsScroll}>
                        <Text style={modalStyles.hint}>
                            By generating and using an affiliate code, you agree
                            to these program terms in addition to Betmundial's
                            general Terms of Use.
                        </Text>
                        {AFFILIATE_TERMS.map((section) => (
                            <View
                                key={section.title}
                                style={modalStyles.termsBlock}
                            >
                                <Text style={modalStyles.termsHeading}>
                                    {section.title}
                                </Text>
                                <Text style={modalStyles.hint}>
                                    {section.body}
                                </Text>
                            </View>
                        ))}
                        <Text style={modalStyles.notice}>
                            Placeholder terms pending official affiliate program
                            copy. Contact support for the latest policy details.
                        </Text>
                    </ScrollView>
                    <TouchableOpacity
                        style={modalStyles.primaryBtn}
                        onPress={onHide}
                    >
                        <Text style={modalStyles.primaryBtnText}>Close</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        padding: 18,
    },
    card: {
        backgroundColor: "#0f1a2e",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        padding: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    title: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 },
    modeRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 10,
        padding: 4,
        marginBottom: 14,
        gap: 4,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    modeBtnActive: { backgroundColor: theme.accent },
    modeBtnText: { color: "rgba(255,255,255,0.7)", fontWeight: "600" },
    modeBtnTextActive: { color: "#fff" },
    label: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 8,
    },
    inputError: { borderColor: "#f87171" },
    inputOk: { borderColor: "#3dd68c" },
    hint: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    bold: { color: "#ffc428", fontWeight: "700" },
    hintOk: { color: "#86efac", fontSize: 13, marginBottom: 8 },
    hintError: { color: "#fca5a5", fontSize: 13, marginBottom: 8 },
    notice: {
        color: "#ffc428",
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 10,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
    },
    cancelBtn: {
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    cancelText: { color: "#fff", fontWeight: "600" },
    primaryBtn: {
        backgroundColor: theme.accent,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 8,
        minWidth: 100,
        alignItems: "center",
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    socialRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
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
    socialLabel: { color: "#fff", fontWeight: "600", fontSize: 13 },
    shareField: { marginBottom: 12 },
    shareFieldControl: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 8,
        paddingLeft: 10,
        paddingVertical: 4,
    },
    shareFieldValue: {
        flex: 1,
        color: "#fff",
        fontSize: 13,
    },
    copyBtn: {
        backgroundColor: theme.accent,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    copyBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
    earnLinks: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 12,
        marginBottom: 12,
    },
    earnLink: { color: "#ffc428", fontWeight: "700", fontSize: 13 },
    termsCard: { maxHeight: "85%" },
    termsScroll: { maxHeight: 360, marginBottom: 10 },
    termsBlock: { marginBottom: 10 },
    termsHeading: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        marginBottom: 4,
    },
});
