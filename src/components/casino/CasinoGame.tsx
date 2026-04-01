import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

import { Context } from "../../context/store";
import { makeRequest } from "../utils/makeRequest";
import Alert from "../utils/Alert";
import { removeItem } from "../utils/local-storage";
interface Props {
    game: any;
}

const CasinoGame: React.FC<Props> = ({ game }) => {
    const [state, dispatch] = useContext(Context);
    const [alertMessage, setAlertMessage] = useState<any>(null);
    const [fetching, setFetching] = useState(false);
    const [showButtons, setShowButtons] = useState(false);

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
                payload: true,
            });
            return;
        }

        const response = await makeRequest({
            url: endpoint,
            method: "GET",
            apiVersion: "CasinoGameLaunch",
        });
        console.log("Game Launch Response:", response);
        if (response?.status == 200
            && !response.data?.tea_pot
            && (response.data?.game_url || response.data?.gameUrl || response.data?.token)) {
            const launchUrl = response.data?.game_url || response.data?.gameUrl || response.data?.token;
            dispatch({
                type: "SET",
                key: "casinolaunch",
                payload: { game: game, url: launchUrl },
            });
            await AsyncStorage.setItem(
                "casinolaunch",
                JSON.stringify({ game: game, url: launchUrl })
            );

            if (game?.aggregator?.toLowerCase() === "bitville") {
                dispatch({
                    type: "SET",
                    key: "bitvilleGame",
                    payload: response.data,
                });
            }

            navigation.navigate("CasinoLaunchedGameScreen", {
                provider: game?.provider_name.split(" ").join("-").toLowerCase(),
                game: game?.game_name.split(" ").join("-").toLowerCase(),
            });
        } else {
            if (response?.status === 403 || (game?.aggregator?.toLowerCase() === "bitville" &&
                (response?.data?.token == null || response?.data?.token == "")
            )) {
                setAlertMessage({
                    status: 403,
                    message: "Please login again.",
                });
                dispatch({
                    type: "DEL",
                    key: "user",
                });
                await removeItem("user");
                dispatch({
                    type: "DEL",
                    key: "showloginmodal",
                });


            } else {
                setAlertMessage({
                    status: 400,
                    message: "Unable to launch Game",
                });
            }
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
                sport_image = require("../../assets/images/casino/casino-default-thumbnail.jpg");
            }

            if (game?.provider_name?.toLowerCase() === "aviatrix") {
                sport_image = require("../../assets/images/casino/aviatrix.jpg");
            }
        } catch (error) {
            sport_image = require("../../assets/images/casino/casino-default-thumbnail.jpg");
        }
        return sport_image;
    };

    // if (!shouldShowGame) return null;

    return (
        <View style={styles.container}>

            {/* IMAGE CLICK AREA ONLY */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowButtons(!showButtons)}
            >
                <Image
                    source={getCasinoImageIcon(game.image_url)}
                    style={styles.image}
                />
            </TouchableOpacity>

            {/* ALERT */}
            {alertMessage && (
                <View style={styles.alert}>
                    <Alert message={alertMessage} />
                </View>
            )}

            {/* BUTTONS (NOT INSIDE IMAGE TOUCHABLE) */}
            {showButtons && (
                <View style={styles.buttons} pointerEvents="box-none">

                    <TouchableOpacity
                        style={[styles.button, styles.playBtn]}
                        activeOpacity={0.7}
                        onPress={() => launchGame(game, 1)}
                    >
                        <Text style={styles.buttonText}>Play</Text>
                    </TouchableOpacity>

                    {game?.aggregator?.toLowerCase() !== "suregames" && (
                        <TouchableOpacity
                            style={[styles.button, styles.demoBtn]}
                            activeOpacity={0.7}
                            onPress={() => launchGame(game, 0)}
                        >
                            <Text style={styles.buttonText}>Demo</Text>
                        </TouchableOpacity>
                    )}

                </View>
            )}

            <Text style={styles.title}>{game?.game_name}</Text>

        </View>
    );
};

export default React.memo(CasinoGame);

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    image: {
        width: "100%",
        height: 100,
        borderRadius: 8,
    },
    alert: {
        position: "absolute",
        bottom: 10,
        left: 10,
    },
    buttons: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "column",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    button: {
        width: "90%",
        marginHorizontal: "auto",
        marginBottom: 8,
        paddingVertical: 8,
        alignItems: "center",
    },
    playBtn: {
        backgroundColor: "#c62828",
    },
    demoBtn: {
        backgroundColor: "#444",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
    title: {
        color: "#fff",
        fontWeight: "600",
        marginTop: 8,
    },
});
