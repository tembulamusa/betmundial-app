import React, { useState, useContext, useEffect, useCallback } from "react";
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Context } from "../../context/store";
import makeRequest from "../utils/makeRequest";
import { Text } from "react-native-svg";

interface Game {
    game_id: string;
    game_name: string;
    image_url?: string;
    aggregator?: string;
    provider_name?: string;
}

const PopulaPromos = () => {
    const [state, dispatch] = useContext(Context);
    const [fetching, setFetching] = useState(false);
    const navigation = useNavigation<any>();

    const fetchTopCasino = useCallback(async () => {

        try {
            setFetching(true);

            const [status, result] = await makeRequest({
                url: "top-games-list",
                method: "GET",
                api_version: "casinoGames",
            });
            if (status === 200 && result) {
                await AsyncStorage.setItem(
                    "toppopularcasino",
                    JSON.stringify(result)
                );

                dispatch({
                    type: "SET",
                    key: "toppopularcasino",
                    payload: result,
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to fetch casino games.");
        } finally {
            setFetching(false);
        }
    }, [dispatch]);

    useEffect(() => {
        const loadTopCasino = async () => {
            const stored = await AsyncStorage.getItem("toppopularcasino");

            if (stored) {
                dispatch({
                    type: "SET",
                    key: "toppopularcasino",
                    payload: JSON.parse(stored),
                });
            } else {
                fetchTopCasino();
            }
        };

        loadTopCasino();
    }, [dispatch, fetchTopCasino]);

    const launchGame = async (game: Game, moneyType = 1) => {
        try {
            if (game?.aggregator?.toLowerCase() === "suregames") {
                navigation.navigate(game.game_id.toLowerCase());
                return;
            }

            const userString = await AsyncStorage.getItem("user");
            const user = userString ? JSON.parse(userString) : null;

            if (moneyType === 1 && !user?.token) {
                dispatch({ type: "SET", key: "showloginmodal", payload: true });
                return;
            }

            setFetching(true);

            let endpoint = `${game?.aggregator || game?.provider_name
                }/casino/game-url/mobile/${moneyType}/${game?.game_id}`;

            if (game?.aggregator?.toLowerCase() === "intouchvas") {
                endpoint += `-${game?.provider_name}`;
            }

            const [status, result] = await makeRequest({
                url: endpoint,
                method: "GET",
                api_version: "CasinoGameLaunch",
            });

            if (status === 200 && result && !result?.tea_pot) {
                const launchUrl = result?.game_url || result?.gameUrl;

                dispatch({
                    type: "SET",
                    key: "casinolaunch",
                    payload: { game, url: launchUrl },
                });

                await AsyncStorage.setItem(
                    "casinolaunch",
                    JSON.stringify({ game, url: launchUrl })
                );

                navigation.navigate("CasinoGame", {
                    provider: game?.provider_name
                        ?.split(" ")
                        .join("-")
                        .toLowerCase(),
                    game: game?.game_name
                        ?.split(" ")
                        .join("-")
                        .toLowerCase(),
                });
            } else {
                Alert.alert("Error", "Unable to launch game");
            }
        } catch (error) {
            Alert.alert("Error", "Game launch failed.");
        } finally {
            setFetching(false);
        }
    };

    const games: Game[] =
        state?.toppopularcasino?.[0]?.gameList || [];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {fetching && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#E53935" />
                </View>
            )}

            <Text style={{ color: "red" }}>I have some games to show!</Text>

            {Array?.isArray(games) &&
                games?.map((game) => (
                    <TouchableOpacity
                        key={game.game_id}
                        style={styles.gameCard}
                        activeOpacity={0.8}
                        onPress={() => launchGame(game, 1)}
                    >
                        <Image
                            source={
                                game?.image_url
                                    ? { uri: game.image_url }
                                    : require("../../assets/images/casino/casino-default-thumbnail.jpeg")
                            }
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
    },
    loader: {
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15,
    },
    gameCard: {
        marginRight: 12,
        borderRadius: 10,
        overflow: "hidden",
    },
    image: {
        width: 130,
        height: 170,
        borderRadius: 10,
    },
});

export default React.memo(PopulaPromos);