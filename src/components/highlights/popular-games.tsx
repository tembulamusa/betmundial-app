import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Platform,
    FlatList,
    Text,
    ActivityIndicator
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

    const getCasinoImageIcon = (imgUrl?: string) => {

        if (!imgUrl || imgUrl.trim() === "") {
            return require("../../assets/images/casino/casino-default-thumbnail.jpg");
        }

        return { uri: imgUrl };

    };

    const launchGame = async (game: Game) => {

        navigation.navigate("CasinoGame", {
            provider: game.provider_name,
            game: game.game_name
        });

    };

    const renderGame = ({ item }: { item: Game }) => (

        <TouchableOpacity
            style={styles.card}
            onPress={() => launchGame(item)}
        >

            <Image
                source={
                    item?.provider_name.toLowerCase() === "unicraft"
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

    gameName: {
        marginTop: 4,
        fontSize: 12,
        textAlign: "center",
        color: "#333",
        fontWeight: "500",
    },

    loader: {
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },

});