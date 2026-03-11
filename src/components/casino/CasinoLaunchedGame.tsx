import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import { WebView } from "react-native-webview";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Context } from "../../../context/store";
import makeRequest from "../../utils/fetch-request";

import { useNavigation, useRoute } from "@react-navigation/native";

const CasinoLaunchedGame = () => {

    const [state, dispatch] = useContext(Context);

    const navigation = useNavigation();
    const route: any = useRoute();

    const { provider, gameName } = route.params || {};

    const [noStateGame, setNoStateGame] = useState<string | undefined>();
    const [bitvilleGame, setBitvilleGame] = useState(false);

    const directLaunch = ["mundial-league", "aviator", "jetx"];

    const handleSessionExpired = async () => {

        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("casinolaunch");

        dispatch({ type: "DEL", key: "user" });

        dispatch({
            type: "SET",
            key: "casinolaunch",
            payload: { game: "", url: "" }
        });

        dispatch({
            type: "SET",
            key: "showloginmodal",
            payload: true
        });

        dispatch({
            type: "SET",
            key: "sessionMessage",
            payload: "Session expired. Please log in again."
        });

        navigation.navigate("Casino" as never);
    };

    const findGameId = (provider: string, gameName: string) => {

        const games =
            state?.casinofilters?.games?.[0]?.gameList || [];

        const matchedGame = games.find(
            (game: any) =>
                game.provider_name.toLowerCase() ===
                provider.toLowerCase() &&
                game.game_name
                    .toLowerCase()
                    .replace(/\s+/g, "-") ===
                gameName.toLowerCase()
        );

        return matchedGame?.game_id;
    };

    const fetchGameUrl = async (
        provider: string,
        gameId: string
    ) => {

        const endpoint = `${provider}/casino/game-url/mobile/1/${gameId}`;

        const [status, result] = await makeRequest({
            url: endpoint,
            method: "GET",
            api_version: "CasinoGameLaunch"
        });

        if (status === 200) {

            const url =
                result?.gameUrl ||
                result?.game_url ||
                result?.token;

            if (url) {

                setNoStateGame(url);

                if (
                    result?.aggregator?.toLowerCase() ===
                    "bitville"
                ) {
                    dispatch({
                        type: "SET",
                        key: "bitvilleGame",
                        payload: result
                    });

                    setBitvilleGame(true);
                }

            } else {
                handleSessionExpired();
            }

        } else {
            navigation.navigate("Casino" as never);
        }
    };

    const launchOldWay = async () => {

        let endpoint =
            "Unicraft/casino/game-url/mobile/1/uicraftvirtuals";

        if (provider?.toLowerCase() === "aviatorllc") {
            endpoint =
                "Bitville/casino/game-url/mobile/1/14914";
        }

        if (gameName?.toLowerCase() === "aviator") {
            endpoint =
                "Bitville/casino/game-url/mobile/1/1370";
        }

        if (gameName?.toLowerCase() === "jetx") {
            endpoint =
                "SmartSoft/casino/game-url/mobile/1/13";
        }

        const [status, result] = await makeRequest({
            url: endpoint,
            method: "GET",
            api_version: "CasinoGameLaunch"
        });

        if (status === 200) {

            const url =
                result?.gameUrl ||
                result?.game_url ||
                result?.token;

            if (url) {

                setNoStateGame(url);

                if (
                    result?.aggregator?.toLowerCase() ===
                    "bitville"
                ) {

                    dispatch({
                        type: "SET",
                        key: "bitvilleGame",
                        payload: result
                    });

                    setBitvilleGame(true);
                }

            } else {
                handleSessionExpired();
            }

        } else {
            navigation.navigate("Casino" as never);
        }
    };

    useEffect(() => {

        dispatch({
            type: "SET",
            key: "iscasinopage",
            payload: true
        });

        if (
            directLaunch.includes(
                gameName?.toLowerCase()
            )
        ) {
            launchOldWay();
        } else {

            AsyncStorage.getItem("casinolaunch")
                .then((stored) => {

                    const game = stored
                        ? JSON.parse(stored)
                        : state?.casinolaunch;

                    dispatch({
                        type: "SET",
                        key: "casinolaunch",
                        payload: game
                    });

                    const parsedUrl =
                        game?.url ||
                        game?.game?.token ||
                        game?.gameUrl ||
                        game?.game?.game_url;

                    if (parsedUrl) {

                        if (
                            game?.game?.aggregator?.toLowerCase() ===
                            "bitville"
                        ) {
                            setBitvilleGame(true);
                        }

                        setNoStateGame(parsedUrl);

                    } else {
                        handleSessionExpired();
                    }
                });
        }

        return () => {

            dispatch({ type: "DEL", key: "iscasinopage" });

            dispatch({ type: "DEL", key: "casinolaunch" });

        };

    }, []);

    return (

        <View style={styles.container}>

            {/* HEADER */}

            {!state?.fullcasinoscreen && (

                <View style={styles.header}>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate(
                                "Casino" as never
                            )
                        }
                    >
                        <Text style={styles.back}>
                            ← Back
                        </Text>
                    </TouchableOpacity>

                </View>

            )}

            {/* GAME */}

            <View style={styles.gameContainer}>

                {noStateGame ? (

                    <WebView
                        source={{ uri: noStateGame }}
                        style={{ flex: 1 }}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                    />

                ) : (

                    <Text style={{ color: "#fff" }}>
                        Loading Game...
                    </Text>

                )}

            </View>

        </View>

    );
};

export default React.memo(CasinoLaunchedGame);

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#000"
    },

    header: {
        padding: 12,
        backgroundColor: "#111"
    },

    back: {
        color: "#fff",
        fontSize: 16
    },

    gameContainer: {
        flex: 1
    }

});