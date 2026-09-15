import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import OddButton from "./OddButton";
import socket from "../utils/SocketConnect";

interface MarketRowProps {
    match: any;
    market_id: string;
    markets: any[];
    rowItems: number;
    live?: boolean;
    producers?: any[];
    marketDetail: any;
    betstopMessage?: any;
    setBetstopMessage?: (msg: any) => void;
}

const sortMarkets = (list: any[]) =>
    [...list].sort(
        (a, b) =>
            (a?.special_bet_value?.localeCompare(b?.special_bet_value) || 0) ||
            (a?.outcome_id - b?.outcome_id) ||
            (a?.odd_key?.localeCompare(b?.odd_key) || 0)
    );

/** Match-detail market block — mirrors web `.top-matches.event-row` */
const MarketRow: React.FC<MarketRowProps> = ({
    match,
    market_id,
    markets,
    rowItems,
    live,
    producers,
    marketDetail,
    betstopMessage,
    setBetstopMessage,
}) => {
    const [mutableMkts, setMutableMkts] = useState(sortMarkets(markets || []));
    const [marketStatus, setMarketStatus] = useState(marketDetail?.market_status);
    const [producerId, setProducerId] = useState(marketDetail?.producer_id);
    const [pdown, setPdown] = useState(false);

    const socketRef = useRef(socket);
    const socketEvent = useMemo(
        () => `socket-io#${match?.parent_match_id}#${marketDetail?.sub_type_id}`,
        [match, marketDetail]
    );

    useEffect(() => {
        if (markets) setMutableMkts(sortMarkets(markets));
        const producer = producers?.find(
            (p) => p.producer_id === marketDetail?.producer_id
        );
        if (producer) setPdown(producer?.disabled);
    }, [markets, producers, marketDetail]);

    useEffect(() => {
        if (!betstopMessage) return;
        const affectedMarkets = betstopMessage.markets?.split(",") || [];
        if (
            affectedMarkets.includes("all") ||
            affectedMarkets.includes(marketDetail?.sub_type_id)
        ) {
            setMutableMkts((prevMarkets) => {
                const newOdds = [...prevMarkets];
                newOdds.forEach((odd) => {
                    odd.market_status = betstopMessage.market_status;
                });
                return newOdds;
            });
            setMarketStatus(betstopMessage?.market_status);
        }
        setBetstopMessage?.(null);
    }, [betstopMessage, marketDetail?.sub_type_id, setBetstopMessage]);

    const handleGameSocket = useCallback(
        (type: string, gameId: string, sub_type_id: string) => {
            if (type === "listen" && socketRef.current?.connected) {
                socketRef.current.emit("user.market.listen", {
                    parent_match_id: gameId,
                    sub_type_id: sub_type_id,
                });
            }
        },
        []
    );

    useEffect(() => {
        if (!socket.connected) return;

        handleGameSocket("listen", match?.parent_match_id, marketDetail?.sub_type_id);

        const handleSocketData = (data: any) => {
            if (Object.keys(data.event_odds || {}).length > 0) {
                Object.values(data.event_odds)?.forEach((evodd: any) => {
                    evodd.name = data.match_market.market_name;
                    setMutableMkts((prevMarkets) => {
                        const index = prevMarkets?.findIndex(
                            (ev) =>
                                ev.sub_type_id === evodd.sub_type_id &&
                                ev.outcome_id === evodd.outcome_id &&
                                (!evodd.special_bet_value ||
                                    ev.special_bet_value ===
                                        evodd.special_bet_value)
                        );

                        if (
                            !["active", "handedover"].includes(
                                marketStatus?.toLowerCase() || ""
                            ) &&
                            ["active", "handedover"].includes(
                                evodd.market_status?.toLowerCase() || ""
                            )
                        ) {
                            setMarketStatus(evodd.market_status);
                        }

                        if (index !== -1) {
                            const newOdds = [...prevMarkets];
                            newOdds[index] = { ...evodd };
                            return sortMarkets(newOdds);
                        }
                        return sortMarkets([...prevMarkets, evodd]);
                    });
                });
            }

            if (producerId !== data.match_market.producer_id && pdown) {
                setPdown(false);
            }
            if (data.match_market.producer_id) {
                setProducerId(data.match_market.producer_id);
            }
        };

        socketRef.current?.on(socketEvent, handleSocketData);

        const onProducer = (data: any) => {
            if (data.producer_id === producerId) {
                setPdown(data.disabled);
            }
        };
        socket.on("PRODUCER_STATUS_CHANNEL", onProducer);

        return () => {
            socketRef.current?.off(socketEvent, handleSocketData);
            socket.off("PRODUCER_STATUS_CHANNEL", onProducer);
        };
    }, [
        socket.connected,
        match?.parent_match_id,
        marketDetail?.sub_type_id,
        socketEvent,
        handleGameSocket,
        marketStatus,
        producerId,
        pdown,
    ]);

    const isMarketActive =
        ["active", "suspended", "handedover"].includes(
            marketStatus?.toLowerCase() || ""
        ) &&
        mutableMkts?.some((odd) =>
            ["active", "suspended", "handedover"].includes(
                odd?.market_status?.toLowerCase() || ""
            )
        );

    if (!isMarketActive) {
        return null;
    }

    const activeOdds = (mutableMkts || []).filter((mkt_odds) =>
        ["active", "suspended", "handedover"].includes(
            mkt_odds?.market_status?.toLowerCase() || ""
        )
    );

    return (
        <View style={styles.container}>
            <View style={styles.marketHeader}>
                <Text style={styles.marketName}>{marketDetail?.name}</Text>
            </View>

            <View style={styles.buttonGrid}>
                {activeOdds.map((mkt_odds, idx) => {
                    const fullMatch = {
                        ...match,
                        ...mkt_odds,
                        market_status: marketStatus,
                        producer_id: producerId || marketDetail?.producer_id,
                    };
                    delete fullMatch.odds;

                    const uniqueKey = `market-row-${match.match_id}-${market_id}-${mkt_odds.outcome_id}-${mkt_odds.special_bet_value || idx}`;
                    const isLastInRow =
                        rowItems === 3
                            ? (idx + 1) % 3 === 0 || idx === activeOdds.length - 1
                            : (idx + 1) % 2 === 0 || idx === activeOdds.length - 1;

                    const shouldRender =
                        mkt_odds.odd_active === 1 &&
                        mkt_odds.odd_value &&
                        mkt_odds.odd_value !== "NaN" &&
                        (!pdown || true);

                    if (!shouldRender) {
                        return (
                            <View
                                key={uniqueKey}
                                style={[
                                    styles.cell,
                                    rowItems === 3
                                        ? styles.threeItems
                                        : styles.twoItems,
                                    !isLastInRow && styles.seam,
                                ]}
                            >
                                <Text style={styles.disabledText}>🔒</Text>
                            </View>
                        );
                    }

                    return (
                        <View
                            key={uniqueKey}
                            style={[
                                styles.cell,
                                rowItems === 3
                                    ? styles.threeItems
                                    : styles.twoItems,
                            ]}
                        >
                            <OddButton
                                match={fullMatch}
                                mkt={market_id}
                                live={live}
                                detail
                                last={isLastInRow}
                            />
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default MarketRow;

const styles = StyleSheet.create({
    container: {
        marginBottom: 7,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
        overflow: "hidden",
    },
    marketHeader: {
        backgroundColor: "rgba(10,22,45,0.69)",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    marketName: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    buttonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "rgba(10,22,45,0.69)",
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        overflow: "hidden",
    },
    cell: {
        minHeight: 40,
    },
    twoItems: {
        width: "50%",
    },
    threeItems: {
        width: "33.333%",
    },
    seam: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: "rgba(255,255,255,0.08)",
    },
    disabledText: {
        fontSize: 16,
        textAlign: "center",
        paddingVertical: 10,
        opacity: 0.6,
    },
});
