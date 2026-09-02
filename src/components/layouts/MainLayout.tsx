import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, Dimensions } from "react-native";
import ConnectivityStatus from "../ConnectivityStatus";
import ConnectivityToast from "../ConnectivityToast";
import BetslipIndex from "../betslip/BetslipIndex";
import PlaceBetDepositModal from "../betslip/PlaceBetDepositModal";
import { theme } from "../../theme";

type Props = { children: React.ReactNode };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function MainLayout({ children }: Props) {
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
            <ConnectivityStatus />
            <ConnectivityToast />

            <View style={styles.container}>{children}</View>

            <View style={styles.betslipOverlay}>
                <BetslipIndex />
            </View>

            <PlaceBetDepositModal />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
    betslipOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: SCREEN_WIDTH,
        pointerEvents: "box-none",
    },
});