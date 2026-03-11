import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    TouchableOpacity
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";

import makeRequest from "../../utils/fetch-request";
import { getFromLocalStorage } from "../../utils/local-storage";

interface Game {
    game_id: string;
    game_name: string;
    game_icon: string;
}

const GamePlay: React.FC = () => {

    const navigation: any = useNavigation();
    const route: any = useRoute();

    const { game_id, live } = route.params || {};

    const [gameUrl, setGameUrl] = useState<string>("");
    const [gameUrlLoaded, setGameUrlLoaded] = useState<boolean>(false);

    const [games] = useState<Game[]>(
        getFromLocalStorage("category_games") || []
    );

    const [isLoggedIn] = useState(
        getFromLocalStorage("user")
    );

    const createPlayer = async () => {

        const endpoint = "/v1/casino/create/player";

        const [status] = await makeRequest({
            url: endpoint,
            method: "GET"
        });

        if (status === 200) {
            // player created
        }
    };

    const startGame = async (gameId: string) => {

        let endpoint =
            live === "0"
                ? `/v1/casino/game/demo-url?game-id=${gameId}`
                : `/v1/casino/game/url?game-id=${gameId}`;

        const [status, result] = await makeRequest({
            url: endpoint,
            method: "GET"
        });

        if (status === 200) {

            setGameUrl(result?.result?.gameURL);
            setGameUrlLoaded(true);

        }

    };

    const CategoryGames = () => (

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gamesRow}
        >

            {games?.map((game, index) => (

                <TouchableOpacity
                    key={index}
                    onPress={() => startGame(game.game_id)}
                >

                    <Image
                        source={{ uri: game.game_icon }}
                        style={styles.gameIcon}
                    />

                </TouchableOpacity>

            ))}

        </ScrollView>

    );

    useEffect(() => {

        if (!isLoggedIn) {

            navigation.navigate("Casino");
            return;

        }

        createPlayer().then(() => {
            startGame(game_id);
        });

    }, []);

    return (

        <View style={styles.container}>

            <Text style={styles.title}>
                Game Play
            </Text>

            {!gameUrlLoaded && (

                <View style={styles.loader}>

                    <ActivityIndicator size="large" />

                </View>

            )}

            {gameUrlLoaded && (

                <WebView
                    source={{ uri: gameUrl }}
                    style={styles.webview}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsFullscreenVideo
                />

            )}

            <CategoryGames />

        </View>

    );

};

export default GamePlay;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#0e131b"
    },

    title: {
        fontSize: 20,
        color: "#fff",
        padding: 10,
        fontWeight: "600"
    },

    loader: {
        height: 300,
        justifyContent: "center",
        alignItems: "center"
    },

    webview: {
        height: 600,
        width: "100%"
    },

    gamesRow: {
        marginTop: 10,
        paddingHorizontal: 10
    },

    gameIcon: {
        height: 50,
        width: 60,
        marginRight: 8
    }

});