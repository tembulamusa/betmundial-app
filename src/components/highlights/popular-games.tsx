import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform,
    FlatList,
    ActivityIndicator,
    Alert,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import { Context } from "../../context/store";
import { getItem, setItem } from "../utils/local-storage";

import MundialLeagueImg from "../../assets/images/casino/mundial-league-thumbnail.jpg";
import { makeRequest } from "../utils/makeRequest";

interface Game {
    game_id: string;
    game_name: string;
    provider_name: string;
    image_url?: string;
    aggregator?: string;
}

const PopularGames: React.FC = () => {

    const navigation: any = useNavigation();
    const [state, dispatch] = useContext<any>(Context);
    const [fetching, setFetching] = useState(false);

    const isMobile = Platform.OS !== "web";

    /* ================= FETCH ================= */
    const fetchTopCasino = async () => {

        setFetching(true);

        const res = await makeRequest<any>({
            url: "top-games-list",
            method: "GET",
            apiVersion: "casinoGames"
        });

        setFetching(false);

        if (res.status === 200) {
            await setItem("toppopularcasino", res.data);

            dispatch({
                type: "SET",
                key: "toppopularcasino",
                payload: res.data
            });
        }
    };

    useEffect(() => {
        (async () => {
            const cached = await getItem("toppopularcasino");

            if (!cached) {
                fetchTopCasino();
            } else {
                dispatch({
                    type: "SET",
                    key: "toppopularcasino",
                    payload: cached
                });
            }
        })();
    }, []);

    /* ================= IMAGE ================= */
    const getCasinoImageIcon = (imgUrl?: string) => {

        if (!imgUrl || imgUrl.trim() === "") {
            return require("../../assets/images/casino/casino-default-thumbnail-opt.jpg");
        }

        return { uri: imgUrl };
    };

    /* ================= FULL WEB LOGIC ================= */
    const launchGame = async (game: Game, moneyType: number = 1) => {

        try {

            /* ✅ SUREGAMES SPECIAL */
            if (game?.aggregator?.toLowerCase() === "suregames") {
                navigation.navigate("CasinoLaunchedGameScreen", {
                    provider: game.provider_name,
                    game: game.game_name,
                });
                return;
            }

            setFetching(true);

            /* ✅ LOGIN CHECK */
            const user = await getItem("user");

            if (moneyType === 1 && !user?.token) {
                dispatch({
                    type: "SET",
                    key: "showloginmodal",
                    payload: true,
                });
                setFetching(false);
                return;
            }

            /* ✅ BUILD ENDPOINT */
            let endpoint = `${game?.aggregator ? game?.aggregator : game?.provider_name
                }/casino/game-url/${isMobile ? "mobile" : "desktop"
                }/${moneyType}/${game.game_id}`;

            if (game?.aggregator?.toLowerCase() === "intouchvas") {
                endpoint = `${endpoint}-${game?.provider_name}`;
            }

            /* ✅ FETCH GAME URL */
            const res = await makeRequest({
                url: endpoint,
                method: "GET",
                apiVersion: "CasinoGameLaunch",
            });

            if (res.status === 200 && !res?.data?.tea_pot) {

                const launchUrl =
                    res?.data?.game_url ||
                    res?.data?.gameUrl ||
                    res?.data?.token;

                if (!launchUrl) {
                    throw new Error("Invalid game URL");
                }

                /* ✅ SAVE TO CONTEXT */
                dispatch({
                    type: "SET",
                    key: "casinolaunch",
                    payload: { game: game, url: launchUrl },
                });

                /* ✅ SAVE TO STORAGE */
                await setItem("casinolaunch", {
                    game: game,
                    url: launchUrl,
                });

                /* ✅ BITVILLE SUPPORT */
                if (game?.aggregator?.toLowerCase() === "bitville") {
                    dispatch({
                        type: "SET",
                        key: "bitvilleGame",
                        payload: res.data,
                    });
                }

                /* ✅ NAVIGATE AFTER STATE READY */
                setTimeout(() => {
                    navigation.navigate("Casino", {
                        screen: "CasinoLaunchedGameScreen",
                        params: {
                            provider: game.provider_name,
                            game: game.game_name,
                        },
                    });
                }, 100);

            } else {
                Alert.alert("Error", "Unable to launch game");
            }

        } catch (err) {
            console.log("Launch error:", err);
            Alert.alert("Error", "Failed to launch game");
        } finally {
            setFetching(false);
        }
    };

    /* ================= RENDER ================= */
    const renderGame = ({ item }: { item: Game }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => launchGame(item, 1)}
        >
            <Image
                source={
                    item?.provider_name?.toLowerCase() === "unicraft"
                        ? MundialLeagueImg
                        : getCasinoImageIcon(item.image_url)
                }
                style={styles.image}
            />
        </TouchableOpacity>
    );

    const games = state?.toppopularcasino?.[0]?.gameList || [];

    if (fetching) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="small" color="#469866" />
            </View>
        );
    }

    return (
        <FlatList
            data={games}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.game_id}
            renderItem={renderGame}
            contentContainerStyle={styles.list}
        />
    );
};

export default React.memo(PopularGames);

/* ================= STYLES ================= */
const styles = StyleSheet.create({

    list: {
        paddingLeft: 10,
    },

    card: {
        marginRight: 6,
        width: 120,
    },

    image: {
        width: 120,
        height: 80,
        borderRadius: 8,
    },

    loader: {
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },

});
