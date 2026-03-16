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
    Alert,
} from "react-native";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";

type BetSlip = {
    game_id: string;
    home_team: string;
    away_team: string;
    bet_pick: string;
    special_bet_value?: string;
    result?: string;
    status: string;
};

type Bet = {
    bet_id: string;
    created: string;
    total_games: number;
    total_odd: number;
    bet_amount: number;
    possible_win: number;
    jackpot_bet_id?: string;
    status: string;
    cancelable: boolean;
    sharable: number;
    betslip: BetSlip[];
};

const MyBetsScreen = () => {
    const [state] = useContext(Context);
    const [bets, setBets] = useState<Bet[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBet, setExpandedBet] = useState<string | null>(null);
    const [shareModal, setShareModal] = useState(false);
    const [shareBet, setShareBet] = useState<Bet | null>(null);

    const fetchBets = async () => {
        setRefreshing(true);

        try {
            const response = await makeRequest({
                url: "user/bets?size=20&page=1",
                method: "GET",
                apiVersion: 2,
            });
            Alert.alert("Bets Response", JSON.stringify(response));
            if ([200, 201].includes(response.status)) {
                setBets(response.result?.data || []);
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

    const toggleExpand = (id: string) => {
        setExpandedBet((prev) => (prev === id ? null : id));
    };

    const cancelBet = async (betId: string) => {
        try {
            const [status] = await makeRequest({
                url: `/user/bet/cancel?bet-id=${betId}`,
                method: "POST",
                api_version: 2,
            });

            if (status === 200) {
                fetchBets();
            }
        } catch (err) {
            console.log(err);
        }
    };

    const renderStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <Ionicons name="ellipse-outline" size={18} color="#00A8FA" />;

            case "won":
                return <FontAwesome name="check-circle" size={18} color="#2ecc71" />;

            case "lost":
                return <Ionicons name="close-circle" size={18} color="#ff4d4d" />;

            case "cancelled":
                return <MaterialIcons name="block" size={18} color="#aaa" />;

            default:
                return <Ionicons name="help-circle" size={18} color="#aaa" />;
        }
    };

    const BetCard = ({ item }: { item: Bet }) => {
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

                    {renderStatusIcon(item.status)}
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

                                <Text style={styles.result}>
                                    {slip.result ?? "n/a"}
                                </Text>

                                {renderStatusIcon(slip.status)}
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
            <Text style={styles.title}>My Bets</Text>

            <FlatList
                data={bets}
                keyExtractor={(item) => item.bet_id.toString()}
                renderItem={({ item }) => <BetCard item={item} />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchBets} />
                }
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
    },

    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        padding: 16,
    },

    card: {
        backgroundColor: "#1e293b",
        margin: 10,
        borderRadius: 10,
        padding: 12,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    date: {
        color: "#aaa",
        fontSize: 12,
    },

    betId: {
        color: "#fff",
        fontWeight: "bold",
    },

    badge: {
        backgroundColor: "#613354",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    badgeText: {
        color: "white",
        fontSize: 10,
    },

    amount: {
        color: "#ccc",
        fontSize: 12,
    },

    win: {
        color: "#2ecc71",
        fontSize: 12,
    },

    details: {
        marginTop: 10,
    },

    slipRow: {
        backgroundColor: "#334155",
        padding: 8,
        borderRadius: 6,
        marginBottom: 6,
    },

    team: {
        color: "white",
        fontSize: 12,
    },

    pick: {
        color: "#ddd",
        fontSize: 12,
    },

    result: {
        color: "#aaa",
        fontSize: 12,
    },

    actions: {
        flexDirection: "row",
        marginTop: 10,
    },

    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 20,
    },

    actionText: {
        color: "white",
        marginLeft: 5,
    },

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
        backgroundColor: "#613354",
        padding: 10,
        alignItems: "center",
        borderRadius: 6,
    },
});