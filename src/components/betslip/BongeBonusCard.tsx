import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Context } from "../../context/store";
import { getItem } from "../utils/local-storage";
import type { BonusAdvice } from "./betslipCalculations";

interface Props {
    advice: BonusAdvice;
    slipCount?: number;
}

/** Mirrors web `bonge-bonus-card.js` — magenta boost alert + Multibet titlebar. */
const BongeBonusCard: React.FC<Props> = ({ advice, slipCount = 0 }) => {
    const [, dispatch] = useContext(Context);
    const [dismissed, setDismissed] = useState(false);

    const adviceSignature = useMemo(
        () =>
            `${advice?.status || ""}|${advice?.nudgeTitle || ""}|${advice?.statusBoost || ""}`,
        [advice]
    );

    useEffect(() => {
        setDismissed(false);
    }, [adviceSignature]);

    const showShareModalDialog = async () => {
        const loggedInUser = await getItem("user");
        if (!loggedInUser) {
            dispatch({ type: "SET", key: "showloginmodal", payload: true });
        } else {
            dispatch({ type: "SET", key: "showsharemodal", payload: true });
        }
    };

    const hasAdvice = Boolean(advice?.status || advice?.nudgeTitle);
    if (!hasAdvice && slipCount <= 0) {
        return null;
    }

    const showAlert = hasAdvice && !dismissed;

    const renderStatus = () => {
        if (!advice?.status) return null;
        if (advice.statusBoost && advice.status.includes(advice.statusBoost)) {
            const parts = advice.status.split(advice.statusBoost);
            return (
                <Text style={styles.alertText}>
                    {parts[0]}
                    <Text style={styles.boostStrong}>{advice.statusBoost}</Text>
                    {parts.slice(1).join(advice.statusBoost)}
                </Text>
            );
        }
        return <Text style={styles.alertText}>{advice.status}</Text>;
    };

    return (
        <View style={styles.block}>
            {showAlert ? (
                <View style={styles.alertWrap}>
                    <View style={styles.alert}>
                        <TouchableOpacity
                            style={styles.dismiss}
                            onPress={() => setDismissed(true)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <MaterialIcons name="close" size={14} color="#fff" />
                        </TouchableOpacity>

                        {advice?.status ? (
                            <View style={styles.body}>
                                {!advice?.nudgeTitle ? (
                                    <MaterialIcons
                                        name="card-giftcard"
                                        size={20}
                                        color="#fff"
                                        style={styles.icon}
                                    />
                                ) : null}
                                <View style={styles.textCol}>{renderStatus()}</View>
                            </View>
                        ) : null}

                        {advice?.nudgeTitle ? (
                            <View style={styles.nudge}>
                                <MaterialIcons
                                    name="card-giftcard"
                                    size={20}
                                    color="#fff"
                                    style={styles.icon}
                                />
                                <View style={styles.nudgeCopy}>
                                    <Text style={styles.nudgeTitle}>
                                        {advice.nudgeTitle}
                                    </Text>
                                    {advice?.nudgeSub ? (
                                        <Text style={styles.nudgeSub}>
                                            {advice.nudgeSub}
                                        </Text>
                                    ) : null}
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>
            ) : null}

            <View style={styles.titlebar}>
                <Text style={styles.titlebarLabel}>Multibet ({slipCount})</Text>
                {slipCount > 0 ? (
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => void showShareModalDialog()}
                        activeOpacity={0.85}
                    >
                        <MaterialIcons name="share" size={12} color="#101b25" />
                        <Text style={styles.shareText}>SHARE</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};

export default React.memo(BongeBonusCard);

const styles = StyleSheet.create({
    block: {
        width: "100%",
        marginBottom: 4,
    },
    alertWrap: {
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
    },
    alert: {
        position: "relative",
        backgroundColor: "#a71f66",
        borderRadius: 4,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 14,
        paddingRight: 36,
    },
    dismiss: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: "rgba(0,0,0,0.2)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },
    body: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    icon: {
        marginTop: 2,
    },
    textCol: {
        flex: 1,
    },
    alertText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "500",
        lineHeight: 18,
    },
    boostStrong: {
        fontWeight: "800",
        color: "#fff",
    },
    nudge: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 4,
    },
    nudgeCopy: {
        flex: 1,
        gap: 2,
    },
    nudgeTitle: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 18,
    },
    nudgeSub: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 12,
        lineHeight: 16,
    },
    titlebar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    titlebarLabel: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    shareBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: "rgba(255,215,0,0.95)",
    },
    shareText: {
        color: "#101b25",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
    },
});
