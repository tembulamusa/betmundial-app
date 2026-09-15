import React, { memo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import {
    BETMUNDIAL_CONTACT_URL,
    BETMUNDIAL_RESPONSIBLE_GAMBLING_URL,
} from "../../constants/responsibleGambling";
import ResponsibleGamblingNotice from "./ResponsibleGamblingNotice";
import { theme } from "../../theme";

type FooterLink = {
    label: string;
    onPress: () => void;
    external?: boolean;
};

/**
 * App footer with legal / help links (mirrors web site-footer menu items).
 */
const SiteFooter = memo(() => {
    const navigation = useNavigation<any>();

    const openExternal = useCallback((url: string) => {
        Linking.openURL(url).catch(() => {});
    }, []);

    const links: FooterLink[] = [
        {
            label: "Responsible Gambling",
            onPress: () => openExternal(BETMUNDIAL_RESPONSIBLE_GAMBLING_URL),
            external: true,
        },
        {
            label: "Privacy Policy",
            onPress: () =>
                navigation.navigate("Sports", { screen: "PrivacyPolicyScreen" }),
        },
        {
            label: "Contact Us",
            onPress: () => openExternal(BETMUNDIAL_CONTACT_URL),
            external: true,
        },
        {
            label: "Getting Help",
            onPress: () =>
                navigation.navigate("Sports", { screen: "GettingHelpScreen" }),
        },
    ];

    return (
        <View style={styles.wrap}>
            <Text style={styles.heading}>Help & Legal</Text>
            {links.map((item) => (
                <TouchableOpacity
                    key={item.label}
                    style={styles.linkRow}
                    onPress={item.onPress}
                    activeOpacity={0.75}
                    accessibilityRole="link"
                    accessibilityLabel={item.label}
                >
                    <MaterialIcons
                        name="chevron-right"
                        size={16}
                        color={theme.accent}
                    />
                    <Text style={styles.linkLabel}>{item.label}</Text>
                    {item.external ? (
                        <MaterialIcons
                            name="open-in-new"
                            size={14}
                            color="rgba(255,255,255,0.45)"
                        />
                    ) : null}
                </TouchableOpacity>
            ))}

            <ResponsibleGamblingNotice style={styles.notice} />

            <Text style={styles.age}>
                18+ only. Gamble responsibly. When the fun stops, STOP.
            </Text>
            <Text style={styles.copy}>
                © {new Date().getFullYear()} Betmundial. All rights reserved.
            </Text>
        </View>
    );
});

SiteFooter.displayName = "SiteFooter";

export default SiteFooter;

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: 14,
        paddingTop: 20,
        paddingBottom: 28,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(0,0,0,0.2)",
        marginTop: 12,
    },
    heading: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    linkRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 9,
        gap: 6,
    },
    linkLabel: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 13,
        fontWeight: "500",
        flex: 1,
    },
    notice: {
        marginTop: 14,
    },
    age: {
        marginTop: 14,
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
        lineHeight: 16,
    },
    copy: {
        marginTop: 6,
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
    },
});
