import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Context } from "../../../context/store";
import makeRequest from "../../utils/fetch-request";
import Notify from "../../utils/Notify";
import Alert from "../../utils/alert";

interface Props {
    game: any;
}

const CasinoGame: React.FC<Props> = ({ game }) => {

    const [state, dispatch] = useContext(Context);
    const [alertMessage, setAlertMessage] = useState < any > (null);
    const [fetching, setFetching] = useState(false);

    const navigation: any = useNavigation();
    const route: any = useRoute();

    const params = route?.params || {};
    const filterType = params?.filterType;
    const filterName = params?.filterName;

    const shouldShowGame =
        filterType?.toLowerCase() === "providers" && filterName !== null;

    /* GET USER */

    const getUser = async () => {
        const user = await AsyncStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    };

    /* LAUNCH GAME */

    const launchGame = async (game: any, moneyType = 1) => {

        if (game?.aggregator?.toLowerCase() === "suregames") {
            navigation.navigate(game?.game_id.toLowerCase());
            return;
        }

        setFetching(true);

        const user = await getUser();

        let endpoint =
            `${game?.aggregator ? game?.aggregator : game?.provider_name}` +
            `/casino/game-url/mobile/${moneyType}/${game.game_id}`;

        if (
            game?.aggregator &&
            game?.aggregator?.toLowerCase() === "intouchvas"
        ) {
            endpoint = endpoint + `-${game?.provider_name}`;
        }

        if (moneyType === 1 && !user?.token) {
            dispatch({
                type: "SET",
                key: "showloginmodal",
                payload: true
            });
            return;
        }

        const [status, result] = await makeRequest({
            url: endpoint,
            method: "GET",
            api_version: "CasinoGameLaunch"
        });

        if (status === 200 && result?.tea_pot == null) {

            const launchUrl = result?.game_url || result?.gameUrl;

            dispatch({
                type: "SET",
                key: "casinolaunch",
                payload: { game: game, url: launchUrl }
            });

            await AsyncStorage.setItem(
                "casinolaunch",
                JSON.stringify({ game: game, url: launchUrl })
            );

            if (game?.aggregator?.toLowerCase() === "bitville") {
                dispatch({
                    type: "SET",
                    key: "bitvilleGame",
                    payload: result
                });
            }

            navigation.navigate(
                "CasinoGameScreen",
                {
                    provider: game?.provider_name
                        .split(" ")
                        .join("-")
                        .toLowerCase(),
                    game: game?.game_name
                        .split(" ")
                        .join("-")
                        .toLowerCase()
                }
            );

        } else {
            setAlertMessage({
                status: 400,
                message: "Unable to launch Game"
            });
        }
    };

    /* AUTO HIDE ALERT */

    useEffect(() => {

        if (alertMessage) {
            setTimeout(() => {
                setAlertMessage(null);
            }, 3000);
        }

    }, [alertMessage]);

    /* IMAGE FALLBACK */

    const getCasinoImageIcon = (imgUrl: string) => {

        let sport_image: any;

        try {

            sport_image = { uri: imgUrl };

            if (!imgUrl || imgUrl.trim() === "") {
                sport_image = require("../../../assets/img/casino/casino-default-thumbnail.jpeg");
            }

            if (game?.provider_name?.toLowerCase() === "aviatrix") {
                sport_image = require("../../../assets/img/casino/aviatrix/aviatrix.jpg");
            }

        } catch (error) {
            sport_image = require("../../../assets/img/casino/casino-default-thumbnail.jpeg");
        }

        return sport_image;
    };

    if (!shouldShowGame) return null;

    return (
        <View style={styles.container}>

            <View style={styles.imageWrapper}>

                <Image
                    source={getCasinoImageIcon(game.image_url)}
                    style={styles.image}
                />

                {alertMessage && (
                    <View style={styles.alert}>
                        <Alert message={alertMessage} />
                    </View>
                )}

                {game?.game_type?.toLowerCase() === "live games" && (
                    <View style={styles.pragmatic}>

                        <View style={styles.betLimits}>
                            <Text style={styles.betText}>
                                Kshs.10 - Kshs.20000
                            </Text>
                        </View>

                        <View style={styles.table}>
                            <Image
                                source={require("../../../assets/img/lock-red.png")}
                                style={styles.lock}
                            />
                        </View>

                        <View style={styles.players}>
                            <Image
                                source={require("../../../assets/img/casino/pragmatic/user.svg")}
                                style={styles.playerIcon}
                            />
                            <Text></Text>
                        </View>

                        <View style={styles.results} />

                    </View>
                )}

            </View>

            <Text style={styles.title}>
                {game?.game_name}
            </Text>

            <View style={styles.buttons}>

                <TouchableOpacity
                    style={[styles.button, styles.playBtn]}
                    onPress={() => launchGame(game, 1)}
                >
                    <Text style={styles.buttonText}>
                        Play
                    </Text>
                </TouchableOpacity>

                {game?.aggregator?.toLowerCase() !== "suregames" && (
                    <TouchableOpacity
                        style={[styles.button, styles.demoBtn]}
                        onPress={() => launchGame(game, 0)}
                    >
                        <Text style={styles.buttonText}>
                            Demo
                        </Text>
                    </TouchableOpacity>
                )}

            </View>

        </View>
    );
};

export default React.memo(CasinoGame);

const styles = StyleSheet.create({

    container: {
        marginBottom: 20
    },

    imageWrapper: {
        position: "relative"
    },

    image: {
        width: "100%",
        height: 160,
        borderRadius: 8
    },

    alert: {
        position: "absolute",
        bottom: 10,
        left: 10
    },

    pragmatic: {
        position: "absolute",
        bottom: 10,
        left: 10
    },

    betLimits: {
        backgroundColor: "#000",
        padding: 4
    },

    betText: {
        color: "#fff",
        fontSize: 10
    },

    table: {
        marginTop: 5
    },

    lock: {
        width: 18,
        height: 18
    },

    players: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5
    },

    playerIcon: {
        width: 16,
        height: 16,
        marginRight: 4
    },

    results: {
        flexDirection: "row"
    },

    title: {
        color: "#fff",
        fontWeight: "600",
        marginTop: 8
    },

    buttons: {
        flexDirection: "row",
        marginTop: 10
    },

    button: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        marginRight: 10
    },

    playBtn: {
        backgroundColor: "#c62828"
    },

    demoBtn: {
        backgroundColor: "#444"
    },

    buttonText: {
        color: "#fff",
        fontWeight: "600"
    }

});