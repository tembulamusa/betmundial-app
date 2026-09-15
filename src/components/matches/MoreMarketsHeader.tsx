import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import socket from "../utils/SocketConnect";
import MatchWidget from "../utils/MatchWidget";

interface Props {
    match: any;
    live?: boolean;
}

/** Match detail top — mirrors web `.match-detail-header` + Betradar LMT area */
const MoreMarketsHeader: React.FC<Props> = ({ match, live }) => {
    const [score, setScore] = useState<string>("");
    const [matchTime, setMatchTime] = useState<any>({});

    const socketRef = useRef(socket);
    const socketEvent = useMemo(
        () => `socket-io#${match?.parent_match_id}`,
        [match]
    );

    const navigation: any = useNavigation();

    const handleBackPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }
        navigation.navigate("Sports", {
            screen: live ? "LiveScreen" : "HomeMain",
        });
    };

    const updateMatchTimeMinutesAndSeconds = (match_time: string) => {
        setMatchTime(() => {
            if (match_time) {
                const [minutes, seconds] = match_time.split(":").map(Number);
                return { minutes, seconds };
            }
            return null;
        });
    };

    const handleGameSocket = useCallback((type: string, gameId: string) => {
        if (type === "listen" && socketRef.current?.connected) {
            socketRef.current.emit("user.match.listen", gameId);
        }
    }, []);

    useEffect(() => {
        setScore(match?.score || "");
        handleGameSocket("listen", match?.parent_match_id);
        updateMatchTimeMinutesAndSeconds(match?.match_time);

        const handleSocketData = (data: any) => {
            setScore(data?.score);
            updateMatchTimeMinutesAndSeconds(data?.match_time);
        };

        socketRef.current?.on(socketEvent, handleSocketData);

        return () => {
            socketRef.current?.off(socketEvent, handleSocketData);
        };
    }, [handleGameSocket, match, socketEvent]);

    const liveTimeLabel =
        matchTime?.minutes != null
            ? `${matchTime.minutes}:${String(matchTime.seconds ?? 0).padStart(2, "0")}`
            : match?.match_time;

    const home = match?.home_team || "Home";
    const away = match?.away_team || "Away";

    return (
        <>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={handleBackPress}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.matchTitle} numberOfLines={2}>
                    {home} - {away}
                </Text>
            </View>

            <MatchWidget
                parentMatchId={match?.parent_match_id}
                homeTeam={home}
                awayTeam={away}
                score={score || match?.score}
                matchTime={liveTimeLabel}
                live={live}
            />
        </>
    );
};

export default React.memo(MoreMarketsHeader);

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#0f0f1f",
        paddingTop: 20,
        paddingHorizontal: 8,
        paddingBottom: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        flexWrap: "wrap",
    },
    backRow: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 6,
        opacity: 0.7,
        paddingTop: 1,
    },
    backText: {
        color: "#fff",
        fontSize: 13,
        marginLeft: 2,
    },
    matchTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "400",
        flex: 1,
        lineHeight: 22,
    },
});
