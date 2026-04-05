import React, {
    useContext,
    useEffect,
    useState,
    useRef
} from "react";

import {
    View,
    StyleSheet,
    Text,
    Animated,
    ActivityIndicator,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent
} from "react-native";

import MatchList from "../../components/matches";
import ShimmerLoader from "../../components/common/ShimmerLoader";
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
    const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
    const [limit] = useState<number>(20);
    const [page, setPage] = useState<number>(1);
    const [producers, setProducers] = useState<any[]>([]);
    const [threeWay, setThreeWay] = useState<boolean>(true);
    const [betradarSportId, setBetradarSportId] = useState<number>(1);
    // const [reload, setReload] = useState<boolean>(false);

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

    const fetchData = async (pageNo?: number, isInitial?: boolean) => {
        const currentPageNo = pageNo || 1;
        const selectedSport = await state?.selectedLivesport || await getItem("selectedLivesport");
        let endpoint =
            "/sports/matches/live/" +
            (spid || 79) +
            (
                `${selectedSport &&
                    selectedSport?.sport_name?.toLowerCase() !== "soccer"
                    ? "/" + selectedSport?.default_market
                    : ""
                }`
            ) +
            "?page=" +
            currentPageNo +
            `&size=${limit || 20}`;

        const isPaginationRequest = currentPageNo > 1;

        if (isInitial || currentPageNo === 1) {
            setFetching(true);
        } else {
            setPaginationLoading(true);
        }

        const response = await makeRequest({
            url: endpoint,
            method: "GET",
            apiVersion: 2
        });

        if (isInitial || currentPageNo === 1) {
            setFetching(false);
            isFirstLoad.current = false;
        } else {
            setPaginationLoading(false);
        }

        if (response?.status == 200) {

            const result = response?.data;
            const newItems = result?.data?.items?.sort(
                (a: any, b: any) =>
                    (a.start_time - b.start_time) ||
                    (b.match_time - a.match_time)
            ) || result;

            // If pagination request, append to existing data
            if (isPaginationRequest) {
                setMatches(prevMatches => [...prevMatches, ...newItems]);
            } else {
                setMatches(newItems);
            }

            setProducers(result?.producer_statuses);

        } else {

            if (currentPageNo === 1) {
                setMatches([]);
            }

        }

    };

    useEffect(() => {
        setPage(1);
        fetchData(1, true);
    }, [spid]);

    // Handle pagination
    useEffect(() => {
        if (page > 1) {
            fetchData(page, false);
        }
    }, [page]);

    useEffect(() => {

        if (state?.selectedLivesport) {

            if (spid) {
                setPage(1);
                fetchData(1, true);
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

    const handleScroll = (
        event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {

        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

        const isEndReached =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50;

        if (isEndReached && !fetching && !paginationLoading) {
            setPage(prev => prev + 1);
        }
    };

    const listHeader = (
        <>
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
        </>
    );

    return (
        <View style={styles.container}>
            <MatchList
                socket={socket}
                live={true}
                matches={!fetching ? matches : []}
                producers={producers}
                three_way={threeWay}
                fetching={fetching}
                // setReload={setReload}
                betslip_key={"betslip"}
                fetchingcount={matches?.length}
                ListHeaderComponent={listHeader}
                onScroll={handleScroll}
                scrollEventThrottle={16}
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
            {paginationLoading && <View style={styles.shimmerContainer}><ShimmerLoader count={3} height={100} marginVertical={8} /></View>}
        </View>

    );

};

export default LiveScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 0,
    },

    liveHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginBottom: 8
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
    },

    shimmerContainer: {
        paddingHorizontal: 0,
        paddingVertical: 8,
        width: '100%',
    }

});
