import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
    memo,
} from "react";

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from "react-native";

import BetslipSubmitForm from "./BetslipSubmitForm";
import BetslipAlert from "./BetslipAlert";
import { Context } from "../../context/store";
import { rebetSlip } from "./betslipActions";

import {
    applyRemoveFromSlip,
    applyRemoveFromJackpotSlip,
    getBetslip,
    getJackpotBetslip,
    persistBetslipSnapshot,
    persistJackpotBetslipSnapshot,
} from "../utils/betslip";
import { betslipStore, commitBetslipUpdate } from "../../stores/betslipStore";

const Betslip: React.FC<{
    jackpot?: boolean;
    jackpotData?: any;
    dbWinMatrix?: Record<string, any>;
    betslipValidationData?: any;
}> = ({ jackpot, jackpotData, dbWinMatrix }) => {
    const [state, dispatch] = useContext(Context);

    const betslipKey = jackpot ? "jackpotbetslip" : "betslip";
    const betslipsData = state?.[betslipKey] || {};

    const [isLoading, setIsLoading] = useState(false);

    const mountedRef = useRef(true);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;

        const loadSlip = async () => {
            setIsLoading(true);

            const slip = jackpot
                ? await getJackpotBetslip()
                : await getBetslip();

            if (!mountedRef.current) return;

            const cleanSlip = slip || {};

            if (
                Object.keys(cleanSlip).length !==
                Object.keys(betslipsData).length
            ) {
                betslipStore.set(betslipKey, cleanSlip);
                dispatch({
                    type: "SET",
                    key: betslipKey,
                    payload: cleanSlip,
                });
            }

            loadedRef.current = true;
            setIsLoading(false);
        };

        void loadSlip();

        return () => {
            mountedRef.current = false;
        };
    }, [jackpot, betslipKey]);

    const handleRemove = useCallback(
        (item: any) => {
            if (!item) return;

            const currentSlip = state?.[betslipKey] || {};
            const nextSlip = jackpot
                ? applyRemoveFromJackpotSlip(currentSlip, item.match_id)
                : applyRemoveFromSlip(currentSlip, item.match_id);

            commitBetslipUpdate(dispatch, betslipKey, nextSlip);

            if (jackpot) {
                persistJackpotBetslipSnapshot(nextSlip);
            } else {
                persistBetslipSnapshot(nextSlip);
            }
        },
        [jackpot, betslipKey, dispatch, state]
    );

    const dismissPlaceBetMessage = useCallback(() => {
        dispatch({ type: "DEL", key: "placebetmessage" });
    }, [dispatch]);

    const handleRebet = useCallback(async () => {
        dispatch({ type: "DEL", key: "placebetmessage" });
        await rebetSlip(state, dispatch);
    }, [dispatch, state]);

    const data = useMemo(
        () => Object.values(betslipsData || {}).filter(Boolean),
        [betslipsData]
    );

    const renderItem = useCallback(
        ({ item }: { item: any }) => {
            if (!item) return null;

            const oddLocked = Number(item.odd_value) === 1;
            const marketLabel = item.odd_type || item.market_name || "Market";
            const pickLabel = item.bet_pick || item.odd_key || "-";

            return (
                <View
                    style={[
                        styles.item,
                        item?.disable && styles.itemWarn,
                        oddLocked && styles.itemLocked,
                    ]}
                >
                    <View style={styles.itemBody}>
                        <Text style={styles.teams} numberOfLines={2}>
                            {item.home_team} - {item.away_team}
                        </Text>

                        <Text style={styles.meta}>
                            {item?.bet_type === 1 || item?.live === 1
                                ? "Live"
                                : "Pre-match"}
                            {item?.start_time ? ` · ${item.start_time}` : ""}
                        </Text>

                        <View style={styles.pickRow}>
                            <Text style={styles.pick} numberOfLines={1}>
                                {marketLabel}: {pickLabel}
                            </Text>
                            <Text style={styles.oddValue}>
                                {Number(item.odd_value).toFixed(2)}
                            </Text>
                        </View>

                        {item?.comment ? (
                            <Text style={styles.comment}>{item.comment}</Text>
                        ) : null}
                    </View>

                    <Pressable
                        onPress={() => handleRemove(item)}
                        style={({ pressed }) => [
                            styles.removeBtn,
                            pressed && styles.removeBtnPressed,
                        ]}
                        hitSlop={8}
                    >
                        <Text style={styles.removeText}>✕</Text>
                    </Pressable>
                </View>
            );
        },
        [handleRemove]
    );

    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#a71f66" />
                    <Text style={styles.loadingText}>Loading betslip...</Text>
                </View>
            ) : data.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.empty}>
                        You have not selected any bet.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => `betslip-${item?.match_id}`}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    initialNumToRender={10}
                />
            )}

            <BetslipAlert
                message={state?.placebetmessage}
                onDismiss={dismissPlaceBetMessage}
                onRebet={handleRebet}
            />

            <BetslipSubmitForm
                jackpot={jackpot}
                jackpotData={jackpotData}
                dbWinMatrix={dbWinMatrix}
            />
        </View>
    );
};

export default memo(Betslip);

const styles = StyleSheet.create({
    container: {
        borderRadius: 0,
    },
    emptyBox: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(255,255,255,0.15)",
        marginBottom: 8,
    },
    empty: {
        color: "#fff",
        textAlign: "center",
        fontSize: 18,
        fontWeight: "500",
        paddingVertical: 8,
    },
    item: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 2,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    itemWarn: {
        opacity: 0.75,
        borderLeftWidth: 3,
        borderLeftColor: "#f29f7a",
    },
    itemLocked: {
        backgroundColor: "#f29f7a",
    },
    itemBody: {
        flex: 1,
        minWidth: 0,
    },
    teams: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
        lineHeight: 18,
    },
    meta: {
        paddingVertical: 3,
        color: "rgba(255,255,255,0.55)",
        fontSize: 11,
    },
    pickRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        gap: 8,
    },
    pick: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 13,
        flex: 1,
    },
    oddValue: {
        color: "#ffd700",
        fontWeight: "700",
        fontSize: 15,
    },
    comment: {
        color: "#f29f7a",
        fontSize: 11,
        marginTop: 4,
    },
    removeBtn: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 10,
        marginTop: -2,
        justifyContent: "center",
        alignItems: "center",
    },
    removeBtnPressed: {
        opacity: 0.4,
        transform: [{ scale: 0.9 }],
        backgroundColor: "rgba(255,0,0,0.1)",
    },
    removeText: {
        color: "#de0808",
        fontWeight: "700",
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
    },
    loadingText: {
        color: "#ccc",
        marginTop: 8,
        fontSize: 14,
    },
});
