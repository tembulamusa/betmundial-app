import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Casino from "../../components/casino/Casino";
import { theme } from "../../theme";

const CasinoScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor={theme.background} />
            <View style={styles.content}>
                <Casino />
            </View>
        </SafeAreaView>
    );
};

export default React.memo(CasinoScreen);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
    },
    content: {
        flex: 1,
    },
});
