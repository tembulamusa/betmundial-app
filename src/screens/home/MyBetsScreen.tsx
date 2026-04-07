import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    memo,
    useMemo,
    useRef,
} from "react";

import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    Modal,
    InteractionManager,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";
import { getItem, setItem } from "../../components/utils/local-storage";

const CACHE_KEY = "mybets_cache";

const MyBetsScreen = () => {
    const [state] = useContext(Context);

    const [bets, setBets] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedBet, setExpandedBet] = useState<number | null>(null);
    const [shareModal, setShareModal] = useState(false);
    const [shareBet, setShareBet] = useState<any>(null);
    const [betFilter, setBetFilter] = useState("all");

    const mountedRef = useRef(true);
    const expandingRef = useRef(false);
    const loadingRef = useRef(false);
    const hasFetchedRef = useRef(false);

    /* ================= LOAD CACHE ================= */
    useEffect(() => {
        (async () => {
            const cached = await getItem(CACHE_KEY);
            if (cached && mountedRef.current) {
                setBets(cached);
            }
        })();

        return () => {
            mountedRef.current = false;
        };
    }, []);

    /* ================= FETCH ================= */
    const fetchBets = useCallback(async () => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        setRefreshing(true);

        try {
            const res = await makeRequest({
                url: "/user/bets?size=20&page=1",
                method: "GET",
                apiVersion: 2,
            });

            if ([200, 201].includes(res.status)) {
                const data = res?.data?.data || [];

                if (mountedRef.current) {
                    setBets(data);
                }

                setItem(CACHE_KEY, data);
            }
        } catch (e) {
            console.log("Error fetching bets", e);
        } finally {
            loadingRef.current = false;
            mountedRef.current && setRefreshing(false);
        }
    }, []);

    /* ================= SAFE INTERACTION MANAGER ================= */
    useEffect(() => {
        if (hasFetchedRef.current) return;

        const task = InteractionManager.runAfterInteractions(() => {
            fetchBets();
            hasFetchedRef.current = true;
        });

        return () => task.cancel();
    }, [fetchBets]);

    /* ================= HELPERS ================= */
    const toggleExpand = useCallback((id: number) => {
        if (expandingRef.current) return;

        expandingRef.current = true;

        setExpandedBet((prev) => (prev === id ? null : id));

        setTimeout(() => {
            expandingRef.current = false;
        }, 200);
    }, []);

    const getBetCategory = useCallback((item: any) => {
        if (item?.jackpot_bet_id) return "jackpot";

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

        const hasCasinoSlip =
            Array.isArray(item?.betslip) &&
            item.betslip.some(
                (slip: any) =>
                    slip?.provider_name ||
                    slip?.game_name ||
                    slip?.aggregator
            );

        if (typeHints.includes("casino") || hasCasinoSlip) {
            return "casino";
        }

        return "sports";
    }, []);

    const filteredBets = useMemo(() => {
        if (betFilter === "all") return bets;
        return bets.filter((item) => getBetCategory(item) === betFilter);
    }, [bets, betFilter, getBetCategory]);

    /* ================= STATUS ================= */
    const renderStatus = useCallback((status: string) => {
        let icon = "circle";
        let color = "#00A8FA";

        switch (status?.toLowerCase()) {
            case "pending":
                icon = "clock-o";
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
                <FontAwesome name={icon} size={14} color={color} />
            </View>
        );
    }, []);

    /* ================= CARD ================= */
    const BetCard = memo(
        ({ item, isExpanded }: { item: any; isExpanded: boolean }) => {
            const expanded = isExpanded;

            const betType = item.jackpot_bet_id
                ? "JACKPOT"
                : item.total_games > 1
                    ? "MULTI"
                    : "SINGLE";

            const visibleSlips = expanded
                ? item.betslip?.slice(0, 5)
                : [];

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
                            <Text style={styles.amount}>
                                Stake: {item.bet_amount}
                            </Text>
                            <Text style={styles.win}>
                                Win: {item.possible_win}
                            </Text>
                        </View>

                        {renderStatus(item.status)}
                    </TouchableOpacity>

                    {expanded && (
                        <View style={styles.details}>
                            {visibleSlips?.map((slip: any) => (
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
                                        {renderStatus(slip.status)}
                                    </View>
                                </View>
                            ))}

                            {item.betslip?.length > 5 && (
                                <Text style={styles.moreText}>
                                    +{item.betslip.length - 5} more
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            );
        },
        (prev, next) =>
            prev.item.bet_id === next.item.bet_id &&
            prev.isExpanded === next.isExpanded
    );

    const renderItem = useCallback(
        ({ item }) => (
            <BetCard
                item={item}
                isExpanded={expandedBet === item.bet_id}
            />
        ),
        [expandedBet]
    );

    /* ================= RENDER ================= */
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Bets</Text>

                <View style={styles.pickerWrap}>
                    <Picker
                        selectedValue={betFilter}
                        onValueChange={setBetFilter}
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
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchBets} />
                }
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={7}
                updateCellsBatchingPeriod={50}
                showsVerticalScrollIndicator={false}
            />

            <Modal visible={shareModal} transparent animationType="fade">
                <View style={styles.modal}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Share Bet</Text>

                        <Text style={styles.modalText}>
                            Bet ID: {shareBet?.bet_id}
                        </Text>

                        <Text style={styles.modalText}>
                            Odds: {shareBet?.total_odd}
                        </Text>

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setShareModal(false)}
                        >
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default memo(MyBetsScreen);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f172a",
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        padding: 14,
        backgroundColor: "rgba(255,255,255,0.08)",
    },

    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },

    pickerWrap: {
        width: 140,
        height: 36,
        borderRadius: 0,
        overflow: "hidden",
        backgroundColor: "#1e293b",
    },

    picker: {
        color: "#fff",
        fontSize: 12,
        marginTop: -6,
    },

    card: {
        backgroundColor: "rgba(255,255,255,0.15)",
        marginHorizontal: 4,
        marginVertical: 2,
        borderRadius: 2,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    date: { color: "#aaa", fontSize: 11 },
    betId: { color: "#fff", fontWeight: "bold" },

    badge: {
        backgroundColor: "#a71f66",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
    },

    badgeText: { color: "#fff", fontSize: 10 },

    amount: { color: "#ccc", fontSize: 11 },
    win: { color: "#2ecc71", fontSize: 11 },

    details: { marginTop: 8 },

    slipRow: {
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: 6,
        borderRadius: 5,
        marginBottom: 5,
    },

    team: { color: "#fff", fontSize: 11 },
    pick: { color: "#ddd", fontSize: 11 },

    slipFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },

    result: { color: "#aaa", fontSize: 11 },

    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
    },

    statusText: {
        color: "#ccc",
        fontSize: 11,
        marginRight: 4,
        textTransform: "capitalize",
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
        color: "#fff",
        fontSize: 16,
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
        borderRadius: 6,
        alignItems: "center",
    },

    closeText: {
        color: "#fff",
        fontWeight: "700",
    },
});