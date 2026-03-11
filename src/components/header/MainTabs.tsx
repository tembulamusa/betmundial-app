import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    StyleSheet
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { Context } from "../../context/store";
import { getItem } from "../utils/local-storage";
import { flagMap } from "../utils/FlagMap";

interface Competition {
    competition_id: number;
    competition_name: string;
    flag_icon: string;
}

interface Props {
    tab: string;
}

const MainTabs: React.FC<Props> = ({ tab }) => {

    const navigation: any = useNavigation();
    const route = useRoute();

    const [state, dispatch] = useContext(Context);

    const [activeTab, setActiveTab] = useState<string>(tab);
    const [topCompetitions, setTopCompetitions] = useState<Competition[]>([]);

    const localSport = getItem("filtersport");

    useEffect(() => {

        let top: any = getItem("topcompetitions");

        // Handle JSON string from storage
        if (typeof top === "string") {
            try {
                top = JSON.parse(top);
            } catch {
                top = [];
            }
        }

        // Ensure it's always an array
        if (!Array.isArray(top)) {
            top = [];
        }

        if (!state?.topcompetitions && top.length) {
            dispatch({
                type: "SET",
                key: "topcompetitions",
                payload: top
            });

            setTopCompetitions(top);
        } else {
            setTopCompetitions(state?.topcompetitions || []);
        }

    }, []);

    const setActiveTabSpace = (selectedTab: string) => {

        dispatch({
            type: "SET",
            key: "active_tab",
            payload: selectedTab
        });

        setActiveTab(selectedTab);
    };

    const handleCompetitionSelect = (competition: Competition) => {

        dispatch({
            type: "SET",
            key: "filtercompetition",
            payload: { competition_id: competition?.competition_id }
        });

        navigation.navigate("CompetitionMatches", {
            id: competition?.competition_id
        });

    };

    const getSportImageIcon = (flag_icon: string) => {
        return flagMap[flag_icon] || flagMap.default;
    };

    return (
        <View style={styles.container}>

            {/* Tabs */}
            <View style={styles.tabsRow}>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "highlights" && styles.activeTab
                    ]}
                    onPress={() => setActiveTabSpace("highlights")}
                >
                    <Text style={styles.tabText}>Highlights</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "today" && styles.activeTab
                    ]}
                    onPress={() => setActiveTabSpace("today")}
                >
                    <Text style={styles.tabText}>Today's</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "tomorrow" && styles.activeTab
                    ]}
                    onPress={() => setActiveTabSpace("tomorrow")}
                >
                    <Text style={styles.tabText}>Tomorrow</Text>
                </TouchableOpacity>

            </View>

            {/* Top competitions */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.competitionScroll}
            >

                {/* All competitions */}
                <TouchableOpacity
                    style={styles.competitionItem}
                    onPress={() =>
                        navigation.navigate("Competition", {
                            sportId:
                                state?.filtersport?.sport_id ||
                                localSport?.sport_id ||
                                79
                        })
                    }
                >
                    <Text style={styles.competitionText}>All</Text>
                </TouchableOpacity>

                {Array.isArray(topCompetitions) &&
                    topCompetitions.slice(0, 5).map((competition) => (

                        <TouchableOpacity
                            key={competition?.competition_id}
                            style={styles.competitionItem}
                            onPress={() => handleCompetitionSelect(competition)}
                        >

                            <Image
                                source={getSportImageIcon(competition?.flag_icon)}
                                style={styles.flag}
                            />

                            <Text style={styles.competitionText}>
                                {competition?.competition_name}
                            </Text>

                        </TouchableOpacity>

                    ))
                }

            </ScrollView>

        </View>
    );
};

export default MainTabs;

const styles = StyleSheet.create({

    container: {
        backgroundColor: "#1e1e1e",
        paddingVertical: 10
    },

    tabsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10
    },

    tab: {
        paddingVertical: 8,
        paddingHorizontal: 12
    },

    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: "#00ffcc"
    },

    tabText: {
        color: "white",
        fontWeight: "bold"
    },

    competitionScroll: {
        paddingHorizontal: 10
    },

    competitionItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 15
    },

    competitionText: {
        color: "white",
        fontSize: 13
    },

    flag: {
        width: 13,
        height: 13,
        marginRight: 6
    }

});