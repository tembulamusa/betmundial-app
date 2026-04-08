import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { theme } from "../../theme";

const PROMO_URL = "https://betmundial.com/promotions";

const PromotionsScreen = () => {
    const navigation: any = useNavigation();
    const [loading, setLoading] = useState(true);

    /* ================= FALLBACK ================= */
    const openExternal = useCallback(() => {
        Alert.alert("Open in browser?", "Unable to load promotions inside app.", [
            { text: "Cancel", style: "cancel" },
            { text: "Open", onPress: () => Linking.openURL(PROMO_URL) }
        ]);
    }, []);

    /* ================= INJECTED JS ================= */
    const injectedJS = `
        (function () {
        const injectStyles = () => {
        const style = document.createElement('style');
                style.innerHTML = \`
                    /* ===== CUSTOM AMT STYLE ===== */
                    .amt {
                        margin: 10px 0 !important;
                    }
                \`;
                document.head.appendChild(style);
            };
            const cleanUI = () => {

                /* ===== REMOVE NAV / HEADER / FOOTER ===== */
                document.querySelectorAll('nav, header, footer').forEach(el => el.remove());

                /* ===== REMOVE TAWK ===== */
                document.querySelectorAll('iframe').forEach(el => {
                    if (el.src && el.src.includes('tawk')) {
                        el.remove();
                    }
                });

                document.querySelectorAll('[id*="tawk"], [class*="tawk"]').forEach(el => el.remove());
                document.querySelectorAll('[class*="betslip-container"]').forEach(el => el.remove());

                /* ===== FIX LAYOUT ===== */
                const html = document.documentElement;
                const body = document.body;

                html.style.margin = "0";
                html.style.padding = "0";
                html.style.height = "100%";

                body.style.margin = "0";
                body.style.padding = "0";
                body.style.height = "100%";
                body.style.minHeight = "100%";
                body.style.width = "100vw";
                body.style.overflowX = "hidden";
                body.style.background = "#000";

                /* ===== REMOVE EMPTY ELEMENTS ===== */
                document.querySelectorAll('div').forEach(el => {
                    if (el.children.length === 0 && el.innerText.trim() === "") {
                        el.style.display = "none";
                    }
                });
            };

            /* ===== BLOCK TAWK SCRIPT ===== */
            const originalAppendChild = Element.prototype.appendChild;
            Element.prototype.appendChild = function(child) {
                if (child.tagName === 'SCRIPT' && child.src && child.src.includes('tawk')) {
                    return child;
                }
                return originalAppendChild.call(this, child);
            };

            /* ===== RUN CLEANUP ===== */
            cleanUI();
            setTimeout(cleanUI, 500);
            setTimeout(cleanUI, 1500);
            setTimeout(cleanUI, 3000);

            /* ===== OBSERVER ===== */
            const observer = new MutationObserver(() => {
                cleanUI();
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });

        })();
        true;
    `;

    /* ================= UI ================= */
    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Promotions</Text>

                <View style={{ width: 50 }} />
            </View>

            {/* LOADER */}
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading promotions...</Text>
                </View>
            )}

            {/* WEBVIEW */}
            <WebView
                source={{ uri: PROMO_URL }}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                injectedJavaScript={injectedJS}
                onLoadEnd={() => setLoading(false)}
                onError={openExternal}
                style={{ flex: 1, backgroundColor: theme.background }}
            />

        </View>
    );
};

export default PromotionsScreen;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },

    back: {
        color: "#fff",
        fontSize: 16,
        width: 50
    },

    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    loader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },

    loadingText: {
        color: "#ccc",
        marginTop: 10,
    },
});