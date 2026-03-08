import React from "react";
import { View, StyleSheet } from "react-native";

import FreeBet from "./highlights/free-bet";
import PopularGames from "./highlights/popular-games";

const HighlightsBoard: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.freeBet}>
                <FreeBet />
            </View>

            <View style={styles.highlights}>
                <PopularGames />
            </View>
        </View>
    );
};

export default React.memo(HighlightsBoard);

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
    },
    freeBet: {
        flex: 1,
    },
    highlights: {
        flex: 1,
    },
});