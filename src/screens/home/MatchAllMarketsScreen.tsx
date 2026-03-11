import React, {
    useState,
    useEffect,
    useContext
} from "react";

import {
    View,
    ActivityIndicator,
    StyleSheet
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";

import { getBetslip } from "../../components/utils/betslip";

import useInterval from "../../hooks/set-interval.hook";

import AllMarketsUnavailable from "../../components/utils/all-markets-unavailable";
import MarketList from "../../components/matches/MarketList";

import { Context } from "../../context/store";
import { makeRequest } from "../../components/utils/makeRequest";
import socket from "../../components/utils/SocketConnect";

import { theme } from "../../theme";

interface Props {
    live?: boolean;
}

const MatchAllMarketsScreen: React.FC<Props> = ({ live }) => {
    const [page, setPage] = useState(1);
    const [producers, setProducers] = useState<any[]>([]);
    const [matchwithmarkets, setMatchWithMarkets] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [betstopMessage, setBetstopMessage] = useState<any>();
    const [socketIsConnected, setSocketIsConnected] = useState(socket.connected);

    // clear when id changes
    useEffect(() => {
        setMatchWithMarkets(undefined);
        setProducers([]);
    }, [matchId, live]);

    const [, dispatch] = useContext(Context);

    const navigation: any = useNavigation();
    const route: any = useRoute();

    const { id, match_id } = route.params || {};
    const matchId = id ?? match_id; // some callers might use match_id

    const findPostableSlip = () => {
        let betslips = getBetslip() || {};

        const values = Object.keys(betslips).map((key) => {
            return betslips[key];
        });

        return values;
    };

    useEffect(() => {

        socket.connect();
        fetchPagedData();

        return () => {
            socket.disconnect();
        };

    }, [matchId, live]);

    const fetchPagedData = () => {

        if (!isLoading && !isNaN(+matchId)) {

            setIsLoading(true);

            let betslip = findPostableSlip();

            let endpoint = live
                ? `/sports/match/live/${matchId}`
                : `/sports/match/${matchId}`;

            makeRequest({
                url: endpoint,
                method: "GET",
                api_version: 2,
            })
                .then((response) => {
                    // makeRequest returns an object, not an array
                    const status = response.status;
                    const result = response.data;

                    if (status && [200, 201].includes(status)) {
                        setMatchWithMarkets(result?.data);
                        setProducers(result?.producer_statuses);
                    } else {
                        // clear or show unavailable if request fails
                        setMatchWithMarkets(undefined);
                        setProducers([]);
                    }
                })
                .catch((err) => {
                    console.warn("MatchAllMarkets fetch error:", err);
                    setMatchWithMarkets(undefined);
                    setProducers([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            // protect against invalid id
            if (!matchwithmarkets) {
                setMatchWithMarkets(undefined);
                setProducers([]);
            }
        }
    };

    const handleGameSocket = () => {

        socket.emit(
            "user.match.listen",
            matchwithmarkets?.parent_match_id
        );

    };

    useInterval(() => {

        if (!socketIsConnected) {
            fetchPagedData();
        }

    }, !socketIsConnected ? 10000 : null);

    useEffect(() => {

        const handleConnect = () => setSocketIsConnected(true);
        const handleDisconnect = () => setSocketIsConnected(false);

        if (matchwithmarkets) {
            handleGameSocket();
        }

        socket.on(
            `socket-io#${matchwithmarkets?.parent_match_id}`,
            (data: any) => {

                if (data.message_type === "betstop") {
                    setBetstopMessage(data);
                } else {

                    if (
                        ["ended"].includes(
                            data.match_status?.toLowerCase()
                        )
                    ) {

                        fetchPagedData();

                    }

                }

            }
        );

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {

            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);

        };

    }, [matchwithmarkets]);

    return (

        <View style={styles.container}>
            {matchwithmarkets && (
                <MarketList
                    live={live}
                    initialMatchwithmarkets={matchwithmarkets}
                    producers={producers}
                    betstopMessage={betstopMessage}
                    setBetstopMessage={setBetstopMessage}
                />
            )}

            {(!matchwithmarkets && !isLoading) &&
                <AllMarketsUnavailable
                    backLink={live ? "/live" : "/"}
                    isLoading={isLoading}
                />
            }

            {isLoading && (
                <ActivityIndicator size="large" />
            )}
        </View>

    );


};

export default MatchAllMarketsScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background,
    }

});