import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { theme } from "../../theme";

interface MatchListProps {
    socket?: any;
    live?: boolean;
    matches?: any[];
    producers?: any[];
    three_way?: boolean;
    fetching?: boolean;
    subTypes?: number[];
    betslip_key?: string;
    fetchingcount?: number;
}

const MatchList: React.FC<MatchListProps> = ({
    matches = [],
    fetching = false,
}) => {
    if (fetching && matches.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    if (!matches.length) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyText}>No matches available</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={matches}
            keyExtractor={(item) => String(item.id ?? item.match_id ?? Math.random())}
            renderItem={({ item }) => (
                <View style={styles.matchRow}>
                    <Text style={styles.matchText} numberOfLines={1}>
                        {item.home_team_name ?? item.home_team ?? "Home"} vs{" "}
                        {item.away_team_name ?? item.away_team ?? "Away"}
                    </Text>
                </View>
            )}
            ListEmptyComponent={
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No matches</Text>
                </View>
            }
        />
    );
};

export default MatchList;

const styles = StyleSheet.create({
    centered: {
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    matchRow: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    matchText: {
        fontSize: 14,
        color: "#fff",
    },
});
