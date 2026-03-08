import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Platform,
} from "react-native";
import { Context } from "../../context/store";
import { getItem } from "../utils/local-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Static Images
import HomeTeamDefaultFlag from "../../assets/images/team-jersies/home-default.png";
import AwayTeamDefaultFlag from "../../assets/images/team-jersies/away-default.png";
import { makeRequest } from "../utils/makeRequest";

interface Outcome {
    odd_key: string;
    odd_value: string;
}

interface FreeBetType {
    home_team: string;
    away_team: string;
    start_time: string;
    odds: {
        "1x2": {
            outcomes: Outcome[];
            producer_id?: string;
        };
    };
    market_active?: string;
    live?: number;
    match_id?: string;
    parent_match_id?: string;
    sport_name?: string;
    amount?: number;
}

const FreeBet: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [state, dispatch] = useContext<any>(Context);
    const [freebet, setFreebet] = useState<FreeBetType | null>(null);
    const [freebetSlip, setFreeBetslip] = useState<any>(null);
    const [selectedOdd, setSelectedOdd] = useState<string | undefined>();
    const [ipInfo, setIpInfo] = useState<string | undefined>();
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState<{ status: number; message: string } | null>(null);

    useEffect(() => {
        (async () => {
            const loadedBetslip = await getItem("freebetSlip");
            if (loadedBetslip) setFreeBetslip(loadedBetslip);
        })();

        fetch("https://api64.ipify.org?format=json")
            .then((res) => res.json())
            .then((data) => setIpInfo(data.ip))
            .catch(() => setIpInfo("Error fetching IP"));
    }, []);

    useEffect(() => {
        if (freebetSlip?.slip[0]?.bet_pick) {
            setSelectedOdd(freebetSlip?.slip[0]?.bet_pick);
        }
    }, [freebetSlip]);

    const placeFreebet = async () => {
        if (!freebetSlip) return;
        setSubmitting(true);

        const endpoint = "/user/place-free-bet";
        const res = await makeRequest<any>({
            url: endpoint,
            method: "POST",
            data: freebetSlip,
            apiVersion: 2,
        });

        setSubmitting(false);
        if ([200, 201].includes(res.status) && (res.data as any)?.status) {
            const result: any = res.data;
            if (["200", "201", 200, 201].includes(result?.status)) {
                setAlert({ status: 200, message: result?.data?.message });
            } else {
                setAlert({ status: 400, message: result?.message || "Unable to place free bet" });
            }
            setFreebet(null);
            setTimeout(() => setAlert(null), 5000);
        } else if (res.status) {
            setAlert({ status: 400, message: res.error || "Unable to place free bet" });
        }
    };

    useEffect(() => {
        if (!freebet) return;
        (async () => {
            const user = await getItem("user");
            const slip = [
                {
                    away_team: freebet.away_team,
                    bet_pick: "",
                    bet_type: "0",
                    home_team: freebet.home_team,
                    live: freebet.live || 0,
                    market_active: freebet.market_active,
                    match_id: freebet.match_id,
                    odd_type: "1x2",
                    odd_value: "1.00",
                    parent_match_id: freebet.parent_match_id,
                    producer_id: freebet.odds?.["1x2"]?.producer_id || "3",
                    special_bet_value: "",
                    sport_name: freebet.sport_name || "Soccer",
                    sub_type_id: "1",
                    ucn: freebet.parent_match_id + (selectedOdd?.trim() || ""),
                },
            ];

            setFreeBetslip({
                account: 1,
                accept_all_odds_change: 1,
                amount: freebet.amount ?? 20,
                app_name: Platform.OS,
                bet_string: "string",
                bet_total_odds: 1,
                bet_type: freebet.live ? "1" : "3",
                channel_id: "mobile",
                ip_address: ipInfo,
                msisdn: user?.msisdn,
                possible_win: 100,
                profile_id: user?.profile_id,
                slip: slip,
            });
        })();
    }, [freebet, selectedOdd, ipInfo]);

    const fetchFreeBet = async () => {
        if (isLoading) return;
        setIsLoading(true);
        const endpoint = "/user/freebet";

        const res = await makeRequest<any>({
            url: endpoint,
            method: "GET",
            apiVersion: 2,
        });

        setIsLoading(false);

        const result: any = res.data;
        if ([200, 201].includes(res.status) && ["200", "201", 200, 201].includes(result?.status) && result?.data != null) {
            setFreebet(result.data);
        }
    };

    useEffect(() => {
        (async () => {
            const user = await getItem("user");
            if (user?.has_freebet == 1) fetchFreeBet();
        })();
    }, []);

    const updatePick = (outcome: Outcome) => {
        if (!freebetSlip) return;
        setFreeBetslip((prev: any) => {
            const newSlip = { ...prev };
            newSlip.slip[0].bet_pick = outcome.odd_key;
            return newSlip;
        });
        setSelectedOdd(outcome.odd_key);
    };

    const AlertBox: React.FC<{ message: { status: number; message: string } }> = ({ message }) => {
        if (!message.status) return null;
        return (
            <View style={[styles.alert, message.status === 200 ? styles.success : styles.error]}>
                <Text style={styles.alertText}>{message.message}</Text>
                <TouchableOpacity onPress={() => setAlert(null)}>
                    <Text style={styles.closeAlert}>×</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (!freebet) return null;

    return (
        <ScrollView style={styles.container}>
            {alert && <AlertBox message={alert} />}

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Icon name="soccer" size={24} color="green" />
                    <Text style={styles.cardTitle}>Free Bet</Text>
                </View>

                <View style={styles.teams}>
                    <View style={styles.team}>
                        <Image source={HomeTeamDefaultFlag} style={styles.teamFlag} />
                        <Text style={styles.teamName}>{freebet.home_team}</Text>
                    </View>

                    <Text style={styles.matchTime}>{freebet.start_time}</Text>

                    <View style={styles.team}>
                        <Image source={AwayTeamDefaultFlag} style={styles.teamFlag} />
                        <Text style={styles.teamName}>{freebet.away_team}</Text>
                    </View>
                </View>

                <View style={styles.marketType}>
                    <View style={styles.line} />
                    <Text style={styles.marketName}>1 x 2</Text>
                    <View style={styles.line} />
                </View>

                <View style={styles.oddsContainer}>
                    {freebet.odds?.["1x2"]?.outcomes?.map((outcome, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.oddsButton,
                                outcome.odd_key === selectedOdd && styles.oddsPicked,
                            ]}
                            onPress={() => updatePick(outcome)}
                        >
                            <Text style={styles.oddsText}>{outcome.odd_value}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedOdd && (
                    <TouchableOpacity
                        style={styles.placeBetBtn}
                        onPress={placeFreebet}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.placeBetText}>Bet Now</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

export default React.memo(FreeBet);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
    },
    card: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    cardTitle: {
        marginLeft: 8,
        fontSize: 18,
        fontWeight: "bold",
        color: "#469866",
    },
    teams: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    team: {
        alignItems: "center",
        width: 80,
    },
    teamFlag: {
        width: 20,
        height: 20,
        marginBottom: 4,
    },
    teamName: {
        textAlign: "center",
        fontSize: 12,
        fontWeight: "500",
    },
    matchTime: {
        fontSize: 12,
        fontWeight: "300",
    },
    marketType: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#ccc",
    },
    marketName: {
        marginHorizontal: 8,
        fontWeight: "bold",
        fontSize: 12,
    },
    oddsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 8,
    },
    oddsButton: {
        backgroundColor: "#e0e0e0",
        padding: 6,
        borderRadius: 6,
        minWidth: 40,
        alignItems: "center",
    },
    oddsPicked: {
        backgroundColor: "#469866",
    },
    oddsText: {
        color: "#000",
        fontWeight: "bold",
    },
    placeBetBtn: {
        backgroundColor: "#469866",
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: "center",
        marginTop: 12,
    },
    placeBetText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    alert: {
        flexDirection: "row",
        padding: 10,
        borderRadius: 6,
        marginBottom: 12,
        alignItems: "center",
        justifyContent: "space-between",
    },
    success: {
        backgroundColor: "#4caf50",
    },
    error: {
        backgroundColor: "#f44336",
    },
    alertText: {
        color: "#fff",
        fontWeight: "bold",
        flex: 1,
    },
    closeAlert: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
        paddingHorizontal: 6,
    },
});