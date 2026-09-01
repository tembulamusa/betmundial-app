import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

import { useNavigation } from "@react-navigation/native";

import { Context } from "../../context/store";
import Alert from "../utils/Alert";
import {
    buildCasinoLaunchEndpoint,
    getCasinoLaunchNavParams,
} from "../utils/casinoLaunch";

interface Props {
    game: any;
}

const CasinoGame: React.FC<Props> = ({ game }) => {
    const [state, dispatch] = useContext(Context);
    const [alertMessage, setAlertMessage] = useState<any>(null);
    const [showButtons, setShowButtons] = useState(false);
    const launchingRef = useRef(false);

    const navigation: any = useNavigation();

    const launchGame = useCallback(
        (moneyType = 1) => {
            if (launchingRef.current) return;

            if (game?.aggregator?.toLowerCase() === "suregames") {
                navigation.navigate(game?.game_id.toLowerCase());
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

            launchingRef.current = true;
            setShowButtons(false);

            const endpoint = buildCasinoLaunchEndpoint(game, moneyType, true);

            navigation.navigate("CasinoLaunchedGameScreen", {
                ...getCasinoLaunchNavParams(game),
                pendingLaunch: {
                    endpoint,
                    game,
                },
            });

            setTimeout(() => {
                launchingRef.current = false;
            }, 400);
        },
        [dispatch, game, navigation, state?.user]
    );

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
                sport_image = require("../../assets/images/casino/casino-default-thumbnail-opt.jpg");
            }

            if (game?.provider_name?.toLowerCase() === "aviatrix") {
                sport_image = require("../../assets/images/casino/aviatrix.jpg");
            }
        } catch (error) {
            sport_image = require("../../assets/images/casino/casino-default-thumbnail-opt.jpg");
        }
        return sport_image;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowButtons(!showButtons)}
            >
                <Image
                    source={getCasinoImageIcon(game.image_url)}
                    style={styles.image}
                />
            </TouchableOpacity>

            {alertMessage && (
                <View style={styles.alert}>
                    <Alert message={alertMessage} />
                </View>
            )}

            {showButtons && (
                <View style={styles.buttons} pointerEvents="box-none">
                    <TouchableOpacity
                        style={[styles.button, styles.playBtn]}
                        activeOpacity={0.7}
                        onPress={() => launchGame(1)}
                    >
                        <Text style={styles.buttonText}>Play</Text>
                    </TouchableOpacity>

                    {game?.aggregator?.toLowerCase() !== "suregames" && (
                        <TouchableOpacity
                            style={[styles.button, styles.demoBtn]}
                            activeOpacity={0.7}
                            onPress={() => launchGame(0)}
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
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 4,
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
        textAlign: "center",
        padding: 8,
    },
});
