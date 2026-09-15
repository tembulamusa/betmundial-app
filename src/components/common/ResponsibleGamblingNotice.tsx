import React, { memo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
    type StyleProp,
    type ViewStyle,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {
    BETMUNDIAL_CONTACT_LABEL,
    BETMUNDIAL_CONTACT_URL,
    RESPONSIBLE_GAMBLING_HELPLINE,
    RESPONSIBLE_GAMBLING_RESOURCE,
} from "../../constants/responsibleGambling";
import { theme } from "../../theme";

type Props = {
    compact?: boolean;
    style?: StyleProp<ViewStyle>;
};

/**
 * Easily discoverable real-money gambling / responsible gambling statement
 * with a tappable contact link that opens in the browser.
 */
const ResponsibleGamblingNotice = memo(({ compact = false, style }: Props) => {
    const openContact = useCallback(() => {
        Linking.openURL(BETMUNDIAL_CONTACT_URL).catch(() => {});
    }, []);

    const dialHelpline = useCallback(() => {
        Linking.openURL(`tel:${RESPONSIBLE_GAMBLING_HELPLINE}`).catch(() => {});
    }, []);

    return (
        <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
            <Text style={[styles.text, compact && styles.textCompact]}>
                This is a real-money gambling app. Please gamble responsibly and only
                bet what you can afford. For gambling addiction help and support,
                please contact {RESPONSIBLE_GAMBLING_RESOURCE} at{" "}
                <Text style={styles.inlineLink} onPress={dialHelpline}>
                    {RESPONSIBLE_GAMBLING_HELPLINE}
                </Text>
                , or visit{" "}
                <Text style={styles.inlineLink} onPress={openContact}>
                    {BETMUNDIAL_CONTACT_LABEL}
                </Text>
                .
            </Text>
            <TouchableOpacity
                onPress={openContact}
                style={styles.linkRow}
                accessibilityRole="link"
                accessibilityLabel="Open Betmundial contact us page"
                activeOpacity={0.75}
            >
                <Text style={styles.link}>{BETMUNDIAL_CONTACT_URL}</Text>
                <MaterialIcons name="open-in-new" size={14} color={theme.accent} />
            </TouchableOpacity>
        </View>
    );
});

ResponsibleGamblingNotice.displayName = "ResponsibleGamblingNotice";

export default ResponsibleGamblingNotice;

const styles = StyleSheet.create({
    wrap: {
        backgroundColor: "rgba(167, 31, 102, 0.12)",
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: theme.accent,
    },
    wrapCompact: {
        padding: 10,
    },
    text: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        lineHeight: 19,
    },
    textCompact: {
        fontSize: 12,
        lineHeight: 17,
    },
    inlineLink: {
        color: theme.accent,
        fontWeight: "700",
        textDecorationLine: "underline",
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 6,
    },
    link: {
        color: theme.accent,
        fontSize: 13,
        fontWeight: "700",
        textDecorationLine: "underline",
        flexShrink: 1,
    },
});
