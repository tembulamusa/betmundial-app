import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

import MarketRow from "./MarketRow"; // Make sure you have a React Native MarketRow
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import socket from "../utils/SocketConnect";

interface MarketListProps {
    live?: boolean;
    initialMatchwithmarkets: any;
    producers?: any;
    betstopMessage?: any;
    setBetstopMessage?: (msg: any) => void;
}

interface MarketFilter {
    name: string;
    value: string | null;
}

const marketFilters: MarketFilter[] = [
    { name: "all", value: null },
    { name: "full time", value: "full time" },
    { name: "inplay", value: "inplay" },
    { name: "handicaps", value: "handicaps" },
    { name: "combo", value: "combo" },
    { name: "teams", value: "teams" },
    { name: "marginals", value: "marginals" },
];

const MarketList: React.FC<MarketListProps> = ({
    live,
    initialMatchwithmarkets,
    producers,
    betstopMessage,
    setBetstopMessage,
}) => {
    const [marketsFilter, setMarketsFilter] = useState<MarketFilter | null>(null);
    const [matchwithmarkets, setMatchWithMarkets] = useState<any>({ ...initialMatchwithmarkets });

    const handleGameSocket = (type: string, gameId: string, sub_type_id?: string) => {
        if (type === "listen" && socket?.connected) {
            socket.emit("user.market.listen", { parent_match_id: gameId, sub_type_id });
        }
    };

    useEffect(() => {
        setMatchWithMarkets({ ...initialMatchwithmarkets });
    }, [initialMatchwithmarkets]);

    useEffect(() => {
        if (matchwithmarkets && socket.connected) {
            handleGameSocket("listen", matchwithmarkets?.parent_match_id);
        }
    }, [socket.connected]);

    const EventUnavailable = () => (
        <View style={styles.unavailableContainer}>
            <ShimmerPlaceholder style={styles.shimmer} />
            <Text style={styles.unavailableText}>Market unavailable</Text>
        </View>
    );

    const MatchDetailFilter = () => (
        <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
            {marketFilters.map((item, idx) => (
                <TouchableOpacity
                    key={idx}
                    style={[
                        styles.filterItem,
                        marketsFilter?.name === item.name ? styles.activeFilterItem : {},
                    ]}
                    onPress={() => setMarketsFilter(item)}
                >
                    <Text style={styles.filterText}>{item.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {!initialMatchwithmarkets ? (
                <EventUnavailable />
            ) : (
                <>
                    {/* Optional: Filter */}
                    {/* <MatchDetailFilter /> */}

                    <FlatList
                        data={Object.entries(matchwithmarkets?.odds || [])}
                        keyExtractor={([mkt_id]) => mkt_id}
                        renderItem={({ item }) => {
                            const [mkt_id, markets] = item;
                            if (
                                !["active", "suspended", "handedover"].includes(
                                    markets?.market_status?.toLowerCase()
                                ) ||
                                markets.outcomes?.length === 0
                            )
                                return null;

                            const sortedMarkets = [...markets.outcomes].sort(
                                (a, b) => (a?.special_bet_value - b?.special_bet_value) || (a?.outcome_id - b?.outcome_id)
                            );

                            return (
                                <MarketRow
                                    key={mkt_id}
                                    betstopMessage={betstopMessage}
                                    setBetstopMessage={setBetstopMessage}
                                    market_id={mkt_id}
                                    markets={sortedMarkets}
                                    rowItems={sortedMarkets.length === 3 ? 3 : 2}
                                    match={matchwithmarkets}
                                    marketDetail={markets}
                                    live={live}
                                    producers={producers}
                                />
                            );
                        }}
                    />
                </>
            )}
        </View>
    );
};

export default MarketList;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 8 },
    unavailableContainer: { alignItems: "center", justifyContent: "center", padding: 16 },
    shimmer: { width: "100%", height: 100, marginBottom: 12 },
    unavailableText: { color: "#999", fontSize: 14 },
    filterContainer: { flexDirection: "row", marginVertical: 8 },
    filterItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: "#222",
    },
    activeFilterItem: { backgroundColor: "#ffcc00" },
    filterText: { color: "#fff", fontSize: 12 },
});