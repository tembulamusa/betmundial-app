import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { theme } from "../../theme";

type Section = {
    number: string;
    title: string;
    body: string[];
};

const SECTIONS: Section[] = [
    {
        number: "01",
        title: "Who we are and scope of this policy",
        body: [
            "This policy applies to personal data processed through betmundial.com and related online interactions controlled by Betmundial / AIB Petals Limited.",
            "Where required by law, we act as the data controller. Service providers may process data on our instructions.",
        ],
    },
    {
        number: "02",
        title: "Personal data we may collect",
        body: [
            "Account and identity information such as mobile number, credentials, name, date of birth, and verification documents where required.",
            "Betting and gaming activity, including bets, stakes, winnings, bonuses, balances and responsible-gambling interactions.",
            "Payment and transaction information for deposits and withdrawals, plus device, IP and usage data for security and fraud prevention.",
        ],
    },
    {
        number: "03",
        title: "How we use your information",
        body: [
            "To create and manage your account, process bets and payments, verify identity, prevent fraud, meet licensing duties, and improve our services.",
            "To send service messages and, where permitted, marketing communications you can opt out of.",
        ],
    },
    {
        number: "04",
        title: "Sharing and retention",
        body: [
            "We may share data with payment providers, regulators, identity/fraud partners and other processors who help us operate lawfully.",
            "We retain personal data only as long as needed for the purposes above or as required by applicable gambling and tax laws.",
        ],
    },
    {
        number: "05",
        title: "Your rights",
        body: [
            "Depending on applicable law you may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent.",
            "You may also lodge a complaint with the competent data-protection authority in your jurisdiction.",
        ],
    },
    {
        number: "06",
        title: "Contact",
        body: [
            "For privacy requests contact support@betmundial.com or customercare@betmundial.com.",
        ],
    },
];

export default function PrivacyPolicyScreen() {
    const navigation = useNavigation<any>();
    const [openId, setOpenId] = useState<string | null>(SECTIONS[0].number);

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
                <Text style={styles.title}>Privacy Policy</Text>
                <Icon name="shield" size={20} color="#e91e8c" />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>
                    This Privacy Policy explains how Betmundial collects, uses and protects your
                    personal information when you use our website and mobile app.
                </Text>

                {SECTIONS.map((section) => {
                    const open = openId === section.number;
                    return (
                        <TouchableOpacity
                            key={section.number}
                            style={styles.accordion}
                            activeOpacity={0.9}
                            onPress={() => setOpenId(open ? null : section.number)}
                        >
                            <View style={styles.accordionHeader}>
                                <Text style={styles.number}>{section.number}</Text>
                                <Text style={styles.accordionTitle}>{section.title}</Text>
                                <Icon
                                    name={open ? "expand-less" : "expand-more"}
                                    size={22}
                                    color="#e91e8c"
                                />
                            </View>
                            {open
                                ? section.body.map((paragraph) => (
                                      <Text key={paragraph} style={styles.body}>
                                          {paragraph}
                                      </Text>
                                  ))
                                : null}
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    onPress={() => Linking.openURL("https://www.facebook.com/betmundialkenya/")}
                >
                    <Text style={styles.socialLink}>Follow us on Facebook</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
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
    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    intro: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 16,
    },
    accordion: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    accordionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    number: {
        color: "#e91e8c",
        fontWeight: "800",
        fontSize: 13,
        minWidth: 28,
    },
    accordionTitle: {
        flex: 1,
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    body: {
        color: "rgba(255,255,255,0.78)",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 10,
    },
    socialLink: {
        color: theme.accent,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 18,
    },
});
