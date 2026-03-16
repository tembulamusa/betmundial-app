import React, { useContext, useEffect, useState } from "react";
import {
    View,
    ScrollView,
    StyleSheet,
    Alert
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Context } from "../../context/store";
import CasinoJackpots from "./CasinoJackpots";
import MobileCategoriesMenu from "./MobileCategoriesMenu";
import CategoryListing from "./CategoryListing";
import NoEvents from "../utils/no-events";
import { makeRequest } from "../utils/makeRequest";
import CasinoCarousel from "../carousel/CasinoCarousel";

interface CasinoProps {
    filterType?: string;
    filterName?: string;
}

const Casino: React.FC<CasinoProps> = ({ filterType, filterName }) => {

    const [state, dispatch] = useContext(Context);

    const [games, setGames] = useState<any[] | null>(null);
    const [fetching, setFetching] = useState(false);


    useEffect(() => {
        fetchCasinoGames();
    }, []);
    const fetchCasinoGames = async () => {
        setFetching(true);

        try {
            let endpoint = "games-list";

            /* ================= FILTER TYPES ================= */

            if (filterType === "categories") {
                const categoryId =
                    state?.casinogamesfilter?.category?.id || filterName;

                endpoint = `game-type/games-list/${categoryId}`;
            }

            else if (filterType === "providers") {
                const providerId =
                    state?.casinogamesfilter?.provider?.id || filterName;

                endpoint = `provider/games-list/${providerId}`;
            }

            else if (filterType === "combinedprovidercategory") {
                endpoint =
                    `provider/games-list/${state?.casinogamesfilter?.provider?.id}/` +
                    `${state?.casinogamesfilter?.category?.id}/` +
                    `${state?.casinogamesfilter?.page || 1}/100`;
            }

            else if (filterType === "providercategory") {
                const providerId = state?.casinogamesfilter?.provider?.id;
                const categoryId = state?.casinogamesfilter?.category?.id;
                const page = state?.casinogamesfilter?.page || 1;
                const limit = 100;

                endpoint =
                    `provider/games-list/${providerId}/${categoryId}?page=${page}&limit=${limit}`;
            }

            /* ================= SEARCH ================= */

            let searchTerm = state?.searchterm || "";

            let method: "GET" | "POST" = "GET";
            let data: any = null;

            if (searchTerm && searchTerm.length >= 3) {
                method = "POST";
                data = { search: searchTerm };
                endpoint = "games/search";
            }

            /* ================= REQUEST ================= */

            const res = await makeRequest<any>({
                url: endpoint,
                method,
                data,
                apiVersion: "casinoGames",
            });


            if ([200, 201].includes(res.status)) {

                const result = res.data;

                let fetchedGames: any = [];

                /* ================= CATEGORY RESPONSE ================= */

                if (endpoint.includes("game-type")) {

                    const gamesData = [{ gameList: result?.content || [] }];

                    const { content, ...rest } = result;

                    const response = {
                        ...rest,
                        games: gamesData,
                        isCategory: true
                    };

                    fetchedGames = gamesData;

                    dispatch({
                        type: "SET",
                        key: "category-filters",
                        payload: response
                    });

                }

                /* ================= NORMAL RESPONSE ================= */

                else {
                    fetchedGames = result?.games || [];
                }

                setGames(fetchedGames);

                /* ================= SAVE FILTERS ================= */

                if (result?.games) {

                    dispatch({
                        type: "SET",
                        key: "casinofilters",
                        payload: result
                    });

                    await AsyncStorage.setItem(
                        "casinofilters",
                        JSON.stringify(result)
                    );
                }

            }

            /* ================= ERROR ================= */

            else {

                setGames([]);

                Alert.alert(
                    "Error",
                    res.error || `Request failed (status ${res.status})`
                );
            }

        } catch (error) {

            console.error("Casino fetch error:", error);

            setGames([]);

            Alert.alert("Error", "Failed to fetch casino games");

        } finally {

            setFetching(false);

        }
    };

    useEffect(() => {

        fetchCasinoGames();

    }, []);

    useEffect(() => {

        dispatch({
            type: "SET",
            key: "nosports",
            payload: true
        });

        const loadFilter = async () => {

            const stored =
                await AsyncStorage.getItem("casinogamesfilter");

            if (stored) {

                dispatch({
                    type: "SET",
                    key: "casinogamesfilter",
                    payload: JSON.parse(stored)
                });

            }

        };

        loadFilter();

        return () => {

            dispatch({
                type: "DEL",
                key: "nosports"
            });

        };

    }, []);

    return (

        <ScrollView style={styles.container}>

            <CasinoCarousel />
            <CasinoJackpots />

            <View style={styles.mobileCategories}>
                <MobileCategoriesMenu />
            </View>

            <View style={styles.gamesList}>
                {fetching && (
                    <View style={styles.loading} />
                )}

                {!fetching && (!games || games?.length < 1) && (
                    <NoEvents message="Casino Games not found" />
                )}

                {Array.isArray(games) && games.map((category, idx) => (

                    category?.gameList?.length > 0 && (<>
                        <CategoryListing
                            key={idx}
                            games={category?.gameList}
                            gamestype={category?.game_type}
                            gamesCategory={state?.casinofilters?.gameTypes}
                            gamesprovider={state?.casinogamesfilter?.provider}
                        /></>

                    )

                ))}

            </View>

        </ScrollView>

    );

};

export default React.memo(Casino);

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)"
    },

    mobileCategories: {
        // paddingHorizontal: 10,
        marginTop: 10
    },

    gamesList: {
        // padding: 10
    },

    loading: {
        height: 120
    }

});