import React from "react";
import { SafeAreaView, StatusBar, View, StyleSheet, Dimensions } from "react-native";
import ConnectivityStatus from "../ConnectivityStatus";
import ConnectivityToast from "../ConnectivityToast";
import BetslipIndex from "../betslip/BetslipIndex";
import { theme } from "../../theme";

type Props = { children: React.ReactNode };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MainLayout({ children }: Props) {
    const BETSLIP_HEIGHT = 80; // height of betslip footer

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="light-content" />
            <ConnectivityStatus />
            <ConnectivityToast />

            {/* Main content */}
            <View style={styles.container}>{children}</View>

            {/* Betslip footer overlaying bottom tabs */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0, // at bottom of screen
                    left: 0,
                    width: SCREEN_WIDTH,
                    height: BETSLIP_HEIGHT,
                    zIndex: 999,
                }}
            >
                <BetslipIndex />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
});