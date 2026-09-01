import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform,
    FlatList,
    ActivityIndicator,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import { Context } from "../../context/store";
import { getItem, setItem } from "../utils/local-storage";
import {
    buildCasinoLaunchEndpoint,
    getCasinoLaunchNavParams,
} from "../utils/casinoLaunch";
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
    const [loadingList, setLoadingList] = useState(false);

    const isMobile = Platform.OS !== "web";

    /* ================= FETCH ================= */
    const fetchTopCasino = async () => {

        setLoadingList(true);

        const res = await makeRequest<any>({
            url: "top-games-list",
            method: "GET",
            apiVersion: "casinoGames"
        });

        setLoadingList(false);

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
    const launchGame = (game: Game, moneyType: number = 1) => {
        if (game?.aggregator?.toLowerCase() === "suregames") {
            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: game.provider_name,
                    game: game.game_name,
                },
            });
            return;
        }

        const hasToken = state?.user?.token || state?.user?.access_token;
        if (moneyType === 1 && !hasToken) {
            dispatch({
                type: "SET",
                key: "showloginmodal",
                payload: true,
            });
            return;
        }

        const endpoint = buildCasinoLaunchEndpoint(game, moneyType, isMobile);

        navigation.navigate("Casino", {
            screen: "CasinoLaunchedGameScreen",
            params: {
                ...getCasinoLaunchNavParams(game),
                pendingLaunch: {
                    endpoint,
                    game,
                },
            },
        });
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

    if (loadingList) {
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
        borderRadius: 8
    },

    loader: {
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },

});
