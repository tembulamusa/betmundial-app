import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform
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
    const [fetching, setFetching] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<any>({});

    const isMobile = Platform.OS !== "web";

    const fetchTopCasino = async () => {

        const endpoint = "top-games-list";

        const res = await makeRequest<any>({
            url: endpoint,
            method: "GET",
            apiVersion: "casinoGames"
        });

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
            const getTopCasino = await getItem("toppopularcasino");

            if (!getTopCasino) {
                fetchTopCasino();
            } else {
                dispatch({
                    type: "SET",
                    key: "toppopularcasino",
                    payload: getTopCasino
                });
            }
        })();

    }, []);

    const getCasinoImageIcon = (imgUrl?: string) => {

        if (!imgUrl || imgUrl.trim() === "") {
            return require("../../assets/images/casino/casino-default-thumbnail.jpg");
        }

        return { uri: imgUrl };

    };

    const launchGame = async (game: Game, moneyType: number = 1) => {

        if (game?.aggregator?.toLowerCase() === "suregames") {

            navigation.navigate(game?.game_id.toLowerCase());

            return;
        }

        setFetching(true);

        let endpoint =
            `${game?.aggregator ? game?.aggregator : game?.provider_name}` +
            `/casino/game-url/${isMobile ? "mobile" : "desktop"}/${moneyType}/${game.game_id}`;

        if (game?.aggregator?.toLowerCase() === "intouchvas") {
            endpoint = endpoint + `-${game?.provider_name}`;
        }

        const user = await getItem("user");
        if (moneyType === 1 && !user?.token) {

            dispatch({
                type: "SET",
                key: "showloginmodal",
                payload: true
            });

            return;
        }

        const res = await makeRequest<any>({
            url: endpoint,
            method: "GET",
            apiVersion: "CasinoGameLaunch"
        });

        if (res.status === 200 && (res.data as any)?.tea_pot == null) {

            const result: any = res.data;
            const launchUrl = result?.game_url || result?.gameUrl;

            dispatch({
                type: "SET",
                key: "casinolaunch",
                payload: { game, url: launchUrl }
            });

            await setItem("casinolaunch", { game, url: launchUrl });

            if (game?.aggregator?.toLowerCase() === "bitville") {
                dispatch({
                    type: "SET",
                    key: "bitvilleGame",
                    payload: result
                });
            }

            setTimeout(() => {

                navigation.navigate("CasinoGame", {
                    provider: game?.provider_name
                        .split(" ")
                        .join("-")
                        .toLowerCase(),
                    game: game?.game_name
                        .split(" ")
                        .join("-")
                        .toLowerCase()
                });

            }, 100);

        } else {

            setAlertMessage({
                status: 400,
                message: "Unable to launch Game"
            });

        }

    };

    return (
        <View style={styles.container}>

            {state?.toppopularcasino &&
                state?.toppopularcasino[0]?.gameList?.map((game: Game) => (

                    <TouchableOpacity
                        key={game.game_id}
                        style={styles.game}
                        onPress={() => launchGame(game, 1)}
                    >

                        <Image
                            source={
                                game?.provider_name.toLowerCase() === "unicraft"
                                    ? MundialLeagueImg
                                    : getCasinoImageIcon(game.image_url)
                            }
                            style={styles.image}
                            resizeMode="cover"
                        />

                    </TouchableOpacity>

                ))}

        </View>
    );

};

export default React.memo(PopularGames);

const styles = StyleSheet.create({

    container: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    game: {
        margin: 6,
    },

    image: {
        width: 140,
        height: 100,
        borderRadius: 8,
    },

});