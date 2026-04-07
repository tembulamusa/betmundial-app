import React, {
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback
} from "react";

import {
    View,
    StyleSheet,
    Text,
    Animated,
    ActivityIndicator,
    InteractionManager,
    Alert,
} from "react-native";

import MatchList from "../../components/matches";
import ShimmerLoader from "../../components/common/ShimmerLoader";
import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";
import { theme } from "../../theme";
import socket from "../../components/utils/SocketConnect";
import Carousel from "../../components/carousel/Carousel";

const LiveScreen: React.FC<any> = ({ route }) => {
    const [state] = useContext(Context);

    const [matches, setMatches] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);
    const [paginationLoading, setPaginationLoading] = useState(false);

    const pageRef = useRef(1);
    const loadingRef = useRef(false);

    const spid = route?.params?.spid || 79;

    /* ================= FETCH DATA ================= */
    const fetchData = useCallback(async (page = 1, initial = false) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        if (initial) setFetching(true);
        else setPaginationLoading(true);

        try {
            const selectedSport = state?.selectedLivesport

            const endpoint =
                `/sports/matches/live/${spid}` +
                (selectedSport && selectedSport?.sport_name !== "soccer"
                    ? `/${selectedSport?.default_market}`
                    : "") +
                `?page=${page}&size=20`;

            const res = await makeRequest({
                url: endpoint,
                method: "GET",
                apiVersion: 2
            });
            if (res?.status === 200) {
                const newItems = res?.data?.data?.items || [];

                setMatches(prev =>
                    page === 1 ? newItems : [...prev, ...newItems]
                );
            } else {
                if (page === 1) setMatches([]);
            }
        } catch (e) {
            console.log("fetch error", e);
        } finally {
            setFetching(false);
            setPaginationLoading(false);
            loadingRef.current = false;
        }
    }, [state?.selectedLivesport, spid]);

    /* ================= INITIAL LOAD ================= */
    useEffect(() => {
        pageRef.current = 1;

        InteractionManager.runAfterInteractions(() => {
            fetchData(1, true);
        });
    }, [spid, state?.selectedLivesport]);

    /* ================= SOCKET ================= */
    useEffect(() => {
        socket.connect();

        const eventName = `socket-io#live-match-page#${state?.selectedLivesport?.betradar_sport_id || 1}`;

        const handler = (data: any) => {
            setMatches(prev => {
                const exists = prev.find(m => m.match_id === data.match_id);
                if (exists) return prev;

                return [data, ...prev];
            });
        };

        socket.on(eventName, handler);

        return () => {
            socket.off(eventName, handler);
        };
    }, [state?.selectedLivesport]);

    /* ================= PAGINATION ================= */
    const loadMore = () => {
        if (loadingRef.current) return;

        pageRef.current += 1;
        fetchData(pageRef.current, false);
    };

    /* ================= BLINK ================= */
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

    /* ================= HEADER ================= */
    const listHeader = (
        <>
            <Carousel />

            <View style={styles.liveHeader}>
                <Animated.View
                    style={[styles.liveDot, { opacity: blinkAnim }]}
                />
                <Text style={styles.liveText}>LIVE</Text>
            </View>

            {fetching && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="red" />
                    <Text style={styles.loadingText}>Loading live matches...</Text>
                </View>
            )}

            {!fetching && matches.length === 0 && (
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
                fetching={fetching}
                onEndReached={loadMore}   // ✅ better than scroll detection
                onEndReachedThreshold={0.5}
                ListHeaderComponent={listHeader}
            />

            {paginationLoading && (
                <View style={styles.shimmerContainer}>
                    <ShimmerLoader count={3} height={100} />
                </View>
            )}
        </View>
    );
};

export default React.memo(LiveScreen);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    liveHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
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
    },

    centerBox: {
        padding: 30,
        alignItems: "center",
    },

    loadingText: {
        marginTop: 10,
        color: "#aaa",
    },

    emptyText: {
        color: "#777",
    },

    shimmerContainer: {
        paddingVertical: 10,
    }
});