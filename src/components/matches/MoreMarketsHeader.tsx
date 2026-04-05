import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import socket from "../utils/SocketConnect";
import MatchWidget from "../utils/MatchWidget";

interface Props {
    match: any;
    live?: boolean;
}

const MoreMarketsHeader: React.FC<Props> = ({ match, live }) => {
    const [score, setScore] = useState<string>("");
    const [matchTime, setMatchTime] = useState<any>({});
    const [matchStatus, setMatchStatus] = useState<string>("");

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
        setMatchTime((prevTime: any) => {
            if (match_time) {
                let [minutes, seconds] = match_time.split(":").map(Number);
                return { minutes, seconds };
            }
            return null;
        });
    };

    const handleGameSocket = useCallback((type: string, gameId: string) => {
        if (type === "listen" && socketRef.current?.connected) {
            socketRef.current.emit("user.match.listen", gameId);
        } else if (type === "leave" && matchStatus?.toLowerCase()?.trim() === "ended") {
            // socketRef.current?.emit('user.match.leave', gameId);
        }
    }, []);

    useEffect(() => {
        handleGameSocket("listen", match?.parent_match_id);
        updateMatchTimeMinutesAndSeconds(match?.match_time);

        const handleSocketData = (data: any) => {
            setScore(data?.score);
            setMatchStatus(data?.match_status);
            updateMatchTimeMinutesAndSeconds(data?.match_time);
        };

        socketRef.current?.on(socketEvent, handleSocketData);

        return () => {
            socketRef.current?.off(socketEvent, handleSocketData);
        };
    }, [handleGameSocket, match, socketEvent]);

    const LivescoreFooter = () => {
        return (
            <View style={styles.footer}>
                <Text style={styles.footerItem}>Match</Text>
                <Text style={styles.footerItem}>Head to head</Text>
                <Text style={styles.footerItem}>Standings</Text>
                <Text style={styles.footerItem}>Lineups</Text>
            </View>
        );
    };

    return (
        <>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backRow}
                    onPress={handleBackPress}
                >
                    <Text style={styles.backIcon}>{"←"}</Text>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>

            <MatchWidget parentMatchId={match?.parent_match_id} />

            {/* <LivescoreFooter /> */}
        </>
    );
};

export default React.memo(MoreMarketsHeader);

const styles = StyleSheet.create({
    header: {
        paddingTop: 12,
        paddingHorizontal: 12,
        // paddingBottom: 10,
        backgroundColor: "#111",
    },

    backRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        backgroundColor: "#000",
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: "flex-start",
    },

    backText: {
        color: "#fff",
        marginLeft: 6,
        fontSize: 13,
        opacity: 0.8,
    },

    backIcon: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        lineHeight: 18,
    },

    teamRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },

    teamBlock: {
        flexDirection: "row",
        alignItems: "center",
    },

    teamJersey: {
        fontSize: 18,
        marginRight: 8,
    },

    teamName: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    vsText: {
        color: "#ccc",
        fontSize: 12,
        marginHorizontal: 8,
    },

    matchTitle: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    footer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 10,
        backgroundColor: "#1a1a1a",
    },

    footerItem: {
        color: "#fff",
        textTransform: "capitalize",
        fontSize: 13,
    },
});
