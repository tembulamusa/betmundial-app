import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from "react-native";
import Casino from "../../components/casino/Casino";

const CasinoScreen: React.FC = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#020617" />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Casino />
            </ScrollView>
        </SafeAreaView>
    );
};

export default CasinoScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#020617",
    },
    scrollContainer: {
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
});