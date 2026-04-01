import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Modal,
    Animated,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import FontAwesome from "react-native-vector-icons/FontAwesome";

import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";

const MyBetsScreen = () => {
    const [state] = useContext(Context);
    const [bets, setBets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBet, setExpandedBet] = useState(null);
    const [shareModal, setShareModal] = useState(false);
    const [shareBet, setShareBet] = useState(null);
    const [betFilter, setBetFilter] = useState("all");

    const fetchBets = async () => {
        setRefreshing(true);
        try {
            const response = await makeRequest({
                url: "/user/bets?size=20&page=1",
                method: "GET",
                apiVersion: 2,
            });

            if ([200, 201].includes(response.status)) {
                setBets(response?.data?.data || []);
            }
        } catch (e) {
            console.log("Error fetching bets", e);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBets();
    }, []);

    const toggleExpand = (id) => {
        setExpandedBet((prev) => (prev === id ? null : id));
    };

    const getBetCategory = (item) => {
        if (item?.jackpot_bet_id) {
            return "jackpot";
        }

        const typeHints = [
            item?.bet_type,
            item?.type,
            item?.category,
            item?.product,
            item?.channel,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const hasCasinoSlip = Array.isArray(item?.betslip) && item.betslip.some((slip) =>
            slip?.provider_name ||
            slip?.game_name ||
            slip?.aggregator
        );

        if (typeHints.includes("casino") || hasCasinoSlip) {
            return "casino";
        }

        return "sports";
    };

    const filteredBets = betFilter === "all"
        ? bets
        : bets.filter((item) => getBetCategory(item) === betFilter);

    const cancelBet = async (betId) => {
        try {
            const [status] = await makeRequest({
                url: `/user/bet/cancel?bet-id=${betId}`,
                method: "POST",
                api_version: 2,
            });

            if (status === 200) fetchBets();
        } catch (err) {
            console.log(err);
        }
    };

    // ✅ FIXED ICON + STATUS
    const renderStatus = (status) => {
        let icon = "circle";
        let color = "#00A8FA";

        switch (status?.toLowerCase()) {
            case "pending":
                icon = "clock-o";
                color = "#00A8FA";
                break;
            case "won":
                icon = "check-circle";
                color = "#2ecc71";
                break;
            case "lost":
                icon = "times-circle";
                color = "#ff4d4d";
                break;
            case "cancelled":
                icon = "ban";
                color = "#aaa";
                break;
        }

        return (
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{status}</Text>
                <FontAwesome name={icon} size={16} color={color} />
            </View>
        );
    };

    const BetCard = ({ item }) => {
        const expanded = expandedBet === item.bet_id;

        const betType = item.jackpot_bet_id
            ? "JACKPOT"
            : item.total_games > 1
                ? "MULTI"
                : "SINGLE";

        return (
            <View style={styles.card}>
                <TouchableOpacity
                    onPress={() => toggleExpand(item.bet_id)}
                    style={styles.cardHeader}
                >
                    <View>
                        <Text style={styles.date}>{item.created}</Text>
                        <Text style={styles.betId}>#{item.bet_id}</Text>
                    </View>

                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{betType}</Text>
                    </View>

                    <View>
                        <Text style={styles.amount}>Stake: {item.bet_amount}</Text>
                        <Text style={styles.win}>Win: {item.possible_win}</Text>
                    </View>

                    {/* ✅ STATUS + ICON */}
                    {renderStatus(item.status)}
                </TouchableOpacity>

                {expanded && (
                    <Animated.View style={styles.details}>
                        {item.betslip?.map((slip) => (
                            <View key={slip.game_id} style={styles.slipRow}>
                                <Text style={styles.team}>
                                    {slip.home_team} vs {slip.away_team}
                                </Text>

                                <Text style={styles.pick}>
                                    {slip.bet_pick}
                                    {slip.special_bet_value
                                        ? ` (${slip.special_bet_value})`
                                        : ""}
                                </Text>

                                <View style={styles.slipFooter}>
                                    <Text style={styles.result}>
                                        {slip.result ?? "n/a"}
                                    </Text>

                                    {/* ✅ SLIP STATUS + ICON */}
                                    {renderStatus(slip.status)}
                                </View>
                            </View>
                        ))}

                        <View style={styles.actions}>
                            {item.cancelable && (
                                <TouchableOpacity
                                    onPress={() => cancelBet(item.bet_id)}
                                    style={styles.actionBtn}
                                >
                                    <FontAwesome name="trash" size={16} color="orangered" />
                                    <Text style={styles.actionText}>Cancel</Text>
                                </TouchableOpacity>
                            )}

                            {item.sharable === 1 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setShareBet(item);
                                        setShareModal(true);
                                    }}
                                    style={styles.actionBtn}
                                >
                                    <FontAwesome name="share" size={16} color="#FFB200" />
                                    <Text style={styles.actionText}>Share</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Bets</Text>

                <View style={styles.pickerWrap}>
                    <Picker
                        selectedValue={betFilter}
                        onValueChange={(value) => setBetFilter(value)}
                        style={styles.picker}
                        dropdownIconColor="#fff"
                    >
                        <Picker.Item label="All" value="all" />
                        <Picker.Item label="Sports" value="sports" />
                        <Picker.Item label="Casino" value="casino" />
                        <Picker.Item label="Jackpot" value="jackpot" />
                    </Picker>
                </View>
            </View>

            <FlatList
                data={filteredBets}
                keyExtractor={(item) => item.bet_id.toString()}
                renderItem={({ item }) => <BetCard item={item} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchBets} />
                }
            />

            <Modal visible={shareModal} transparent animationType="slide">
                <View style={styles.modal}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Share Bet</Text>

                        <Text style={styles.modalText}>Bet ID: {shareBet?.bet_id}</Text>
                        <Text style={styles.modalText}>Odds: {shareBet?.total_odd}</Text>

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShareModal(false)}
                        >
                            <Text style={{ color: "white" }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default React.memo(MyBetsScreen);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0f172a" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        marginBottom: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
    },

    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        textAlign: "left",
    },

    pickerWrap: {
        width: 150,
        height: 40,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#1e293b",
    },

    picker: {
        color: "#fff",
        fontSize: 12,
        marginTop: -6,
    },

    card: {
        backgroundColor: "#1e293b",
        margin: 4,
        borderRadius: 4,
        padding: 12,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    date: { color: "#aaa", fontSize: 12 },
    betId: { color: "#fff", fontWeight: "bold" },

    badge: {
        backgroundColor: "#a71f66",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    badgeText: { color: "white", fontSize: 10 },

    amount: { color: "#ccc", fontSize: 12 },
    win: { color: "#2ecc71", fontSize: 12 },

    details: { marginTop: 10 },

    slipRow: {
        backgroundColor: "#334155",
        padding: 8,
        borderRadius: 6,
        marginBottom: 6,
    },

    team: { color: "white", fontSize: 12 },
    pick: { color: "#ddd", fontSize: 12 },

    slipFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },

    result: { color: "#aaa", fontSize: 12 },

    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    statusText: {
        color: "#ccc",
        fontSize: 12,
        marginRight: 4,
        textTransform: "capitalize",
    },

    actions: { flexDirection: "row", marginTop: 10 },

    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 20,
    },

    actionText: { color: "white", marginLeft: 5 },

    modal: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
    },

    modalCard: {
        backgroundColor: "#1e293b",
        margin: 20,
        padding: 20,
        borderRadius: 10,
    },

    modalTitle: {
        fontSize: 18,
        color: "white",
        marginBottom: 10,
    },

    modalText: {
        color: "#ccc",
        marginBottom: 5,
    },

    closeBtn: {
        marginTop: 20,
        backgroundColor: "#a71f66",
        padding: 10,
        alignItems: "center",
        borderRadius: 6,
    },
});
