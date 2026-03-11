import React, { useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import CasinoCarousel from "../../carousel/casino-carousel";
import NoEvents from "../../utils/no-events";
import CasinoGame from "./CasinoGame";
import GameCategoryListing from "./CategoryListing";

import { Context } from "../../../context/store";
import makeRequest from "../../utils/fetch-request";

const CasinoHome: React.FC = () => {

    const [state, dispatch] = useContext(Context);

    const [games, setGames] = useState<any[]>(state?.casinogames || []);
    const [fetching, setFetching] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const sectionRefs: any = {
        "must-play": useRef<View>(null),
        "new-games": useRef<View>(null),
        "live": useRef<View>(null),
        "tables": useRef<View>(null),
        "drops-wins": useRef<View>(null),
        "daily-offers": useRef<View>(null)
    };

    /* FETCH CASINO GAMES */

    const fetchCasinoGames = async () => {

        setFetching(true);

        let endpoint = "games-list";

        if (state?.casinogamesfilter?.filterType === "category") {
            endpoint = `game-type/games-list/${state?.casinogamesfilter?.category?.id}`;
        }

        else if (state?.casinogamesfilter?.filterType === "provider") {
            endpoint = `provider/games-list/${state?.casinogamesfilter?.provider?.id}`;
        }

        const [status, result] = await makeRequest({
            url: endpoint,
            method: "GET",
            api_version: "faziCasino"
        });

        if (status === 200) {

            if (Array.isArray(result.games)) {

                setGames(result.games);

                dispatch({
                    type: "SET",
                    key: "casinogames",
                    payload: result.games
                });

                await AsyncStorage.setItem(
                    "casinogames",
                    JSON.stringify(result.games)
                );

            } else {
                setGames([]);
            }
        }

        setFetching(false);
    };

    /* INITIAL LOAD */

    useEffect(() => {

        const loadLocalGames = async () => {

            const stored = await AsyncStorage.getItem("casinogames");

            if (stored) {

                const parsed = JSON.parse(stored);

                if (Array.isArray(parsed)) {

                    setGames(parsed);

                    dispatch({
                        type: "SET",
                        key: "casinogames",
                        payload: parsed
                    });

                    return;
                }
            }

            fetchCasinoGames();
        };

        loadLocalGames();

    }, []);

    /* FILTERED GAMES */

    const filteredGames = Array.isArray(games)
        ? games.map((category) => ({
            ...category,
            gameList: category.gameList
                ? category.gameList.slice(0, 4)
                : []
        }))
        : [];

    /* SCROLL TO SECTION */

    const scrollToSection = (section: string) => {

        const ref = sectionRefs[section];

        ref?.current?.measureLayout(
            scrollRef.current as any,
            (x: number, y: number) => {
                scrollRef.current?.scrollTo({ y, animated: true });
            }
        );

    };

    const sections = [
        "must-play",
        "new-games",
        "live",
        "tables",
        "drops-wins",
        "daily-offers"
    ];

    return (

        <ScrollView ref={scrollRef} style={styles.container}>

            {/* Carousel */}

            <CasinoCarousel />

            {/* Tabs */}

            <View style={styles.tabs}>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("must-play")}
                >
                    <Text style={styles.tabText}>🎮 Must Play</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("new-games")}
                >
                    <Text style={styles.tabText}>🔥 New Games</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("live")}
                >
                    <Text style={styles.tabText}>🔴 Live</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("tables")}
                >
                    <Text style={styles.tabText}>🎲 Tables</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("drops-wins")}
                >
                    <Text style={styles.tabText}>🎁 Drops & Wins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => scrollToSection("daily-offers")}
                >
                    <Text style={styles.tabText}>💰 Daily Offers</Text>
                </TouchableOpacity>

            </View>

            {/* Sections */}

            <View style={styles.sectionContainer}>

                {sections.map((section, idx) => {

                    const sectionGames = Array.isArray(games)
                        ? games.slice(0, 4)
                        : [];

                    return (

                        <View
                            key={idx}
                            ref={sectionRefs[section]}
                            style={styles.section}
                        >

                            <Text style={styles.sectionTitle}>
                                {section.replace("-", " ")}
                            </Text>

                            <View style={styles.gamesList}>

                                {fetching ? (

                                    <Text style={{ color: "#aaa" }}>
                                        Loading games...
                                    </Text>

                                ) : filteredGames?.length < 1 ? (

                                    <NoEvents message="Casino Games not found" />

                                ) : (

                                    filteredGames.map((category, idx) => (
                                        <GameCategoryListing
                                            key={idx}
                                            games={category.gameList}
                                        />
                                    ))

                                )}

                            </View>

                        </View>

                    );
                })}

            </View>

        </ScrollView>
    );
};

export default CasinoHome;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#0f172a"
    },

    tabs: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        padding: 10
    },

    tab: {
        backgroundColor: "#1e293b",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginBottom: 8
    },

    tabText: {
        color: "#fff",
        fontWeight: "600"
    },

    sectionContainer: {
        padding: 10
    },

    section: {
        marginBottom: 30
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 10,
        textTransform: "capitalize"
    },

    gamesList: {
        marginTop: 10
    }

});