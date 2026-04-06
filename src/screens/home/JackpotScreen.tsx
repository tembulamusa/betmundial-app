import React, { useEffect, useCallback, useState, useContext } from "react";
import {
    InteractionManager,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { JackpotMatchList, JackpotResultsList, JackpotHeader } from "../../components/matches/JackpotComponents";
import dailyJackpot from "../../assets/images/banners/jackpot/DailyJackpot-opt.jpeg";
import {
    addToJackpotSlip,
    getJackpotBetslip
} from "../../components/utils/betslip";
import { makeRequest } from "../../components/utils/makeRequest";
import { Context } from "../../context/store";
import { theme } from "../../theme";

const JackpotScreen: React.FC<any> = () => {

    const [jackpotData, setJackpotData] = useState<any>(null);
    const [results, setResults] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"matches" | "results">("matches");
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [loadingResults, setLoadingResults] = useState(true);

    const [, dispatch] = useContext(Context);

    const Float = (equation: number, precision = 4) => {
        return Math.round(equation * (10 ** precision)) / (10 ** precision);
    };

    const fetchMatches = async () => {
        setLoadingMatches(true);
        try {
            const matchEndpoint = "/jackpot/matches";
            const response = await makeRequest({
                url: matchEndpoint,
                method: "GET",
                apiVersion: 2
            });

            if (response.status === 200) {
                setJackpotData(response?.data?.data || null);
                dispatch({ type: "SET", key: "jackpotdata", payload: response?.data?.data });
            } else {
                setJackpotData(null);
            }
        } finally {
            setLoadingMatches(false);
        }

        let jackpotbetslip = getJackpotBetslip();
        dispatch({ type: "SET", key: "jackpotbetslip", payload: jackpotbetslip });

    };




    const fetchResults = async () => {
        setLoadingResults(true);
        try {
            const resultsEndpoint = "/jackpot/results";
            const response = await makeRequest({
                url: resultsEndpoint,
                method: "GET",
                apiVersion: 2
            });

            if (response?.status === 200) {
                setResults(response?.data?.data || response?.data || null);
            } else {
                setResults(null);
            }
        } finally {
            setLoadingResults(false);
        }

    };

    useEffect(() => {
        InteractionManager.runAfterInteractions(() => {
            fetchMatches();
            fetchResults();
        });

    }, []);

    const AutoPickAllMatches = () => {

        const clean = (_str: string) => {
            _str = _str.replace(/[^A-Za-z0-9\-]/g, "");
            return _str.replace(/-+/g, "-");
        };

        const randomPick = (min: number, max: number) => {
            return Math.floor(min + Math.random() * (max - min + 1));
        };

        if (jackpotData) {

            let betslip: any;
            Object.entries(jackpotData?.matches).map(([key, match]: any) => {

                let reference = match.match_id + "_selected";
                let pick = randomPick(1, 3);

                let pickedValue =
                    pick === 1
                        ? match.home_team
                        : pick === 2
                            ? "draw"
                            : match.away_team;

                let oddValue =
                    pick === 1
                        ? Float(match.odds["1x2"]["outcomes"][0].odd_value, 2)
                        : pick === 2
                            ? Float(match.odds["1x2"]["outcomes"][1].odd_value, 2)
                            : Float(match.odds["1x2"]["outcomes"][2].odd_value, 2);

                let cstm = clean(match.match_id + "" + 1 + pickedValue);

                let slip = {
                    match_id: match.match_id,
                    parent_match_id: match.parent_match_id,
                    special_bet_value: "",
                    sub_type_id: 1,
                    bet_pick: pickedValue,
                    odd_value: oddValue,
                    home_team: match.home_team,
                    away_team: match.away_team,
                    bet_type: "9",
                    odd_type: "3",
                    sport_name: "soccer",
                    live: 0,
                    ucn: cstm,
                    market_active: 1
                };

                betslip = addToJackpotSlip(slip);

                dispatch({
                    type: "SET",
                    key: reference,
                    payload: cstm
                });

            });

            dispatch({
                type: "SET",
                key: "jackpotbetslip",
                payload: betslip
            });

        }

    };

    useEffect(() => {

        dispatch({ type: "SET", key: "betslipkey", payload: "jackpotbetslip" });
        dispatch({ type: "SET", key: "isjackpot", payload: true });

        return () => {
            dispatch({ type: "DEL", key: "isjackpot" });
            dispatch({ type: "SET", key: "betslipkey", payload: "betslip" });
        };

    }, []);

    return (

        <ScrollView style={styles.container}>

            <Image
                source={dailyJackpot}
                style={styles.banner}
                resizeMode="cover"
            />

            {/* <View style={styles.header}>
                <JackpotHeader jackpot={jackpotData} />
            </View> */}

            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab("matches")}
                    style={[
                        styles.tab,
                        activeTab === "matches" && styles.activeTab
                    ]}
                >
                    <Text style={styles.tabText}>Matches</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab("results")}
                    style={[
                        styles.tab,
                        activeTab === "results" && styles.activeTab
                    ]}
                >
                    <Text style={styles.tabText}>Results</Text>
                </TouchableOpacity>
            </View>

            {activeTab === "matches" && (

                <View>

                    {loadingMatches ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.loading}>Loading jackpots...</Text>
                        </View>
                    ) : (
                        <>
                            {(jackpotData?.status?.toLowerCase() === "active" &&
                                jackpotData?.matches?.length === jackpotData?.total_games) && (

                                    <View style={styles.autopickRow}>

                                        <Text style={styles.jackpotAmount}>
                                            KES{" "}
                                            {Intl.NumberFormat("en-US").format(
                                                jackpotData?.jackpot_amount
                                            )}
                                        </Text>

                                        <TouchableOpacity
                                            style={styles.autopickButton}
                                            onPress={AutoPickAllMatches}
                                        >
                                            <Text style={styles.autopickText}>Auto Pick</Text>
                                        </TouchableOpacity>

                                    </View>
                                )}

                            {(jackpotData?.matches?.length > 0 &&
                                jackpotData?.total_games) ? (

                                <JackpotMatchList matches={jackpotData} />

                            ) : (

                                <View style={styles.noEvents}>
                                    <Text style={styles.noEventsText}>There are no jackpots at the moment.</Text>
                                </View>

                            )}
                        </>
                    )}

                </View>
            )}

            {activeTab === "results" && (

                loadingResults ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loading}>Loading results...</Text>
                    </View>
                ) : results ? (
                    <JackpotResultsList results={results} />
                ) : (
                    <View style={styles.noEvents}>
                        <Text style={styles.noEventsText}>No jackpot results found.</Text>
                    </View>
                )

            )}

        </ScrollView>

    );
};

export default React.memo(JackpotScreen);

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: theme.background,
    },

    banner: {
        width: "100%",
        height: 80
    },

    header: {
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: 10
    },

    tabs: {
        flexDirection: "row"
    },

    tab: {
        flex: 1,
        padding: 12,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)"
    },

    activeTab: {
        backgroundColor: "#bb0243"
    },

    tabText: {
        color: "#fff",
        fontWeight: "600"
    },

    autopickRow: {
        padding: 12,
        alignItems: "center"
    },

    jackpotAmount: {
        color: "#fff",
        marginBottom: 10
    },

    autopickButton: {
        backgroundColor: "#ffcc00",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        fontSize: 24,
        fontWeight: "600"
    },

    autopickText: {
        fontWeight: "600"
    },

    noEvents: {
        padding: 30,
        alignItems: "center",
        color: "#fff"
    },
    noEventsText: {
        color: "#fff",
        fontSize: 16
    },

    loading: {
        textAlign: "center",
        marginTop: 12,
        color: "#fff"
    },

    loadingContainer: {
        paddingVertical: 30,
        alignItems: "center",
    }

});
