import React, {
    useContext,
    useEffect,
    useState,
    useRef
} from "react";

import {
    View,
    ScrollView,
    StyleSheet,
    Alert,
    Text,
    Animated,
    ActivityIndicator
} from "react-native";

import MatchList from "../../components/matches";
import useInterval from "../../hooks/set-interval.hook";
import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";
import { theme } from "../../theme";
import socket from "../../components/utils/SocketConnect";
import Carousel from "../../components/carousel/Carousel";
import { getItem } from "../../components/utils/local-storage";

const LiveScreen: React.FC<any> = ({ route }) => {

    const [matches, setMatches] = useState<any[]>([]);
    const [state, dispatch] = useContext(Context);

    const [fetching, setFetching] = useState<boolean>(false);
    const [limit] = useState<number>(300);
    const [producers, setProducers] = useState<any[]>([]);
    const [threeWay, setThreeWay] = useState<boolean>(true);

    const [page] = useState<number>(1);
    const [betradarSportId, setBetradarSportId] = useState<number>(1);
    const [reload, setReload] = useState<boolean>(false);

    const [socketIsConnected, setSockectIsConnected] =
        useState<boolean>(socket.connected);

    const socketRef = useRef(socket);
    const isFirstLoad = useRef(true);

    const spid = route?.params?.spid || 79;

    const handleGameSocket = (type: string) => {

        if (state?.selectedLivesport?.betradar_sport_id || 1) {

            if (type === "listen" && socketRef.current?.connected) {

                socketRef.current.emit(
                    "user.live-match-page.listen",
                    betradarSportId
                );

            } else if (type === "leave") {

                socketRef.current?.emit(
                    "user.live-match-page.leave",
                    betradarSportId
                );

            }

        }

    };

    useInterval(() => {

        if (!socketIsConnected) {
            fetchData();
        }

    }, !socketIsConnected ? 3000 : null);

    useEffect(() => {

        handleGameSocket("listen");

        socket.on(
            `socket-io#live-match-page#${state?.selectedLivesport?.betradar_sport_id || 1}`,
            (data: any) => {

                setMatches((preveMatches: any[]) => {

                    let odds: any = {};

                    let selectedSport =
                        state?.selectedLivesport
                            ? state?.selectedLivesport?.betradar_sport_id
                            : 1;

                    let sport_name =
                        state?.selectedLivesport
                            ? state?.selectedLivesport?.sport_name
                            : "soccer";

                    if (selectedSport == 1) {

                        odds["1x2"] = {
                            sub_type_id: 1,
                            name: "1x2",
                            special_bet_value: "",
                            outcomes: []
                        };

                        odds["Double Chance"] = {
                            sub_type_id: 10,
                            name: "Double Chance",
                            special_bet_value: "",
                            outcomes: []
                        };

                        odds["Total"] = {
                            sub_type_id: 18,
                            name: "Total",
                            special_bet_value: "2.5",
                            outcomes: []
                        };

                    } else {

                        odds[state?.selectedLivesport?.dafault_display_markets] = {
                            sub_type_id: state?.selectedLivesport?.default_market,
                            name: state?.selectedLivesport?.dafault_display_markets,
                            special_bet_value: "",
                            outcomes: []
                        };

                    }

                    data.odds = odds;
                    data.sport_name = sport_name;

                    let startTime = data.start_time?.[1] || "";
                    data.start_time = startTime;

                    let index = preveMatches?.findIndex(
                        (ev) => ev.match_id == data.match_id
                    );

                    if (index !== -1) {
                        return preveMatches;
                    }

                    return [...preveMatches, data].sort(
                        (a, b) =>
                            (a.start_time - b.start_time) ||
                            (b.match_time - a.match_time)
                    );

                });

            }
        );

        const handleConnect = () => setSockectIsConnected(true);
        const handleDisconnect = () => setSockectIsConnected(false);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

    }, [betradarSportId, socket.connected]);

    const fetchData = async () => {

        let endpoint =
            "/sports/matches/live/" +
            (spid || 79) +
            (
                `${state?.selectedLivesport &&
                    state?.selectedLivesport?.sport_name?.toLowerCase() !== "soccer"
                    ? "/" + state?.selectedLivesport?.default_market
                    : ""
                }`
            ) +
            "?page=" +
            (page || 1) +
            `&size=${limit || 200}`;

        if (isFirstLoad.current) {
            setFetching(true);
        }

        const response = await makeRequest({
            url: endpoint,
            method: "GET",
            apiVersion: 2
        });

        // Alert.alert("Live Matches", JSON.stringify(response));

        if (isFirstLoad.current) {
            setFetching(false);
            isFirstLoad.current = false;
        }

        if (response?.status == 200) {

            const result = response?.data;

            setMatches(
                result?.data?.items?.sort(
                    (a: any, b: any) =>
                        (a.start_time - b.start_time) ||
                        (b.match_time - a.match_time)
                ) || result
            );

            setProducers(result?.producer_statuses);

        } else {

            setMatches([]);

        }

    };

    useEffect(() => {
        fetchData();
    }, [spid]);

    useEffect(() => {

        if (state?.selectedLivesport) {

            if (spid) {
                fetchData();
            }

            setBetradarSportId(
                state?.selectedLivesport?.betradar_sport_id
            );

            setThreeWay(
                ["competition", "threeway"].includes(
                    state?.selectedLivesport?.sport_type?.toLowerCase()
                )
            );

        } else {

            setBetradarSportId(1);
            setThreeWay(true);

        }

    }, [state?.selectedLivesport]);

    useEffect(() => {

        if (reload == true) {
            fetchData();
        }

        setReload(false);

    }, [reload]);

    useEffect(() => {

        let currentLive = getItem("selectedLivesport");

        if (!state?.selectedLivesport && currentLive) {

            dispatch({
                type: "SET",
                key: "selectedLivesport",
                payload: currentLive
            });

        }

        socket.connect();

        return () => {
            socket.disconnect();
        };

    }, []);

    const blinkAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {

        Animated.loop(
            Animated.sequence([
                Animated.timing(blinkAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(blinkAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ).start();

    }, []);

    return (

        <ScrollView style={styles.container}>

            <Carousel />

            <View style={styles.liveHeader}>
                <Animated.View
                    style={[
                        styles.liveDot,
                        { opacity: blinkAnim }
                    ]}
                />
                <Text style={styles.liveText}>LIVE</Text>
            </View>

            {fetching && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="red" />
                    <Text style={styles.loadingText}>Loading live matches...</Text>
                </View>
            )}

            {!fetching && matches?.length === 0 && (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyText}>
                        No live matches available
                    </Text>
                </View>
            )}

            {!fetching && matches?.length > 0 && (
                <MatchList
                    socket={socket}
                    live={true}
                    matches={matches}
                    producers={producers}
                    three_way={threeWay}
                    fetching={fetching}
                    setReload={setReload}
                    betslip_key={"betslip"}
                    fetchingcount={matches?.length}
                    subTypes={
                        state?.selectedLivesport
                            ?
                            state?.selectedLivesport?.sport_name?.toLowerCase() !== "soccer"
                                ?
                                [state?.selectedLivesport?.default_market]
                                :
                                [1, 10, 18]
                            :
                            [1, 10, 18]
                    }
                />
            )}

        </ScrollView>

    );

};

export default LiveScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background
    },

    liveHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
    },

    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "red",
        marginRight: 8
    },

    liveText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14
    },

    centerBox: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center"
    },

    loadingText: {
        marginTop: 10,
        color: "#aaa",
        fontSize: 16
    },

    emptyText: {
        color: "#777",
        fontSize: 16
    }

});
