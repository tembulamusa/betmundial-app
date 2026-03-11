import React, {
    useContext,
    useEffect,
    useState,
    useRef,
} from "react";

import {
    View,
    ScrollView,
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Text,
} from "react-native";

import { useRoute, RouteProp } from "@react-navigation/native";

import { Context } from "../context/store";
import useInterval from "../hooks/set-interval.hook";

import HighlightsBoard from "../components/highlights-board";
import MatchList from "../components/matches";
import CarouselLoader from "../components/carousel/Carousel";
import MainTabs from "../components/header/MainTabs";
// import PopupBanner from "../components/pop_up_banner";

import socket from "../components/utils/SocketConnect";
import { getItem } from "../components/utils/local-storage";
import { makeRequest } from "../components/utils/makeRequest";
import { theme } from "../theme";

type RootStackParamList = {
    Home: {
        sportid?: string;
        categoryid?: string;
        competitionid?: string;
    };
};

type HomeRouteProp = RouteProp<RootStackParamList, "Home">;

interface Match {
    id?: number;
    [key: string]: any;
}

const HomeScreen: React.FC = () => {

    const route = useRoute<HomeRouteProp>();

    const { sportid, categoryid } = route.params || {};

    const [allSportId, setAllSportId] = useState<number | undefined>();
    const [threeWay, setThreeWay] = useState<boolean>(true);
    const [matches, setMatches] = useState<Match[]>([]);
    const [limit] = useState<number>(300);
    const [page, setPage] = useState<number>(1);

    const [state] = useContext<any>(Context);

    const [fetching, setFetching] = useState<boolean>(false);
    const [fetchingCount, setFetchingCount] = useState<number>(0);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [producers, setProducers] = useState<any[]>([]);

    const homePageRef = useRef<View>(null);

    const fetchData = async (controlText?: string) => {

        setFetching(true);
        setFetchError(null);

        let fetchcount = fetchingCount + 1;

        let filtersport = state?.filtersport || await getItem("filtersport");

        let pageNo = 1;
        let limitSize = limit || 300;

        let tab = "highlights";
        let method: "GET" | "POST" = "GET";

        let endpoint =
            "/sports/matches/pre-match/" +
            (filtersport?.sport_id || allSportId || 79) +
            `?page=${pageNo}&size=${limitSize}`;

        if (state?.filtercategory) {
            endpoint += "&category_id=" + state?.filtercategory?.category_id;
        } else if (categoryid) {
            endpoint += "&category_id=" + categoryid;
        }

        if (state?.active_tab) {
            tab = state?.active_tab;
        }

        endpoint += "&tab=" + tab;

        if (state?.filtercompetition && controlText !== "fetchAll") {
            endpoint =
                `/sports/competitions/matches/${state?.filtercompetition?.competition_id}`;
        }

        let data: any = null;

        let searchTerm = state?.searchterm || "";

        if (searchTerm && searchTerm.length >= 3) {

            method = "POST";

            data = {
                search: searchTerm,
                sport_id: filtersport?.sport_id || allSportId || 79,
            };

            endpoint = `/sports/matches/search`;
        }

        if (filtersport) {
            setThreeWay(
                ["competition", "threeway"].includes(
                    filtersport?.sport_type?.toLowerCase()
                )
            );
        } else {
            setThreeWay(true);
        }

        try {
            const res = await makeRequest<any>({
                url: endpoint,
                method,
                data,
                apiVersion: 2,
            });

            setFetchingCount(fetchcount);

            if ([200, 201].includes(res.status)) {
                const result = res.data;
                setMatches((result as any)?.data?.items || (result as any) || []);
                setProducers((result as any)?.producer_statuses || []);
            } else {
                setMatches([]);
                setProducers([]);
                setFetchError(res.error || `Request failed (status ${res.status})`);
            }
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {

        if (sportid) {
            fetchData("fetchAll");
        } else {
            fetchData("filtered");
            setFetchingCount(0);
        }

    }, [
        sportid,
        state?.filtercategory,
        state?.filtercompetition,
        state?.active_tab,
        state?.searchterm,
    ]);

    useInterval(() => {
        if (!socket.connected) {
            fetchData();
        }
    }, 60000);

    useEffect(() => {

        socket.connect();

        return () => {
            socket.disconnect();
        };

    }, []);

    const handleScroll = (
        event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {

        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

        const isEndReached =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 50;

        if (isEndReached && !fetching) {
            setFetching(true);
            setPage(prev => prev + 1);
        }
    };

    return (
        <View style={styles.container} ref={homePageRef}>

            <ScrollView
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >

                <CarouselLoader />

                <View style={styles.highlightsBoard}>
                    <HighlightsBoard />
                </View>

                <MainTabs tab={"highlights"} />

                {fetchError ? (
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                        <View style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 10 }}>
                            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>
                                {fetchError}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <MatchList
                    socket={socket}
                    live={false}
                    matches={matches}
                    producers={producers}
                    three_way={threeWay}
                    fetching={fetching}
                    subTypes={
                        state?.filtersport
                            ? state?.filtersport?.sport_name.toLowerCase() !== "soccer"
                                ? [state?.filtersport?.default_market]
                                : [1, 10, 18]
                            : [1, 10, 18]
                    }
                    betslip_key={"betslip"}
                    fetchingcount={fetchingCount}
                />

                {/* <PopupBanner /> */}

            </ScrollView>

        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    highlightsBoard: {
        marginVertical: 5,
    },

});