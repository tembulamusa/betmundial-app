import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert
} from "react-native";

import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation, useRoute } from "@react-navigation/native";
import { makeRequest } from "../utils/makeRequest";
import { Context } from "../../context/store";

const CasinoLaunchedGameScreen = () => {

    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation();
    const route: any = useRoute();

    const { provider, gameName } = route.params || {};

    const [noStateGame, setNoStateGame] = useState<string | undefined>();
    const [bitvilleGame, setBitvilleGame] = useState(false);

    const directLaunch = ["mundial-league", "aviator", "jetx"];

    /* ================= SESSION EXPIRE ================= */
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

    /* ================= OLD WAY LAUNCH ================= */
    const launchOldWay = async () => {
        // reset state first
        setNoStateGame(undefined);
        setBitvilleGame(false);

        let endpoint = "Unicraft/casino/game-url/mobile/1/uicraftvirtuals";

        if (gameName?.toLowerCase() === "aviator") {
            endpoint = "Bitville/casino/game-url/mobile/1/1370";
        }
        if (gameName?.toLowerCase() === "jetx") {
            endpoint = "SmartSoft/casino/game-url/mobile/1/13";
        }

        const response = await makeRequest({
            url: endpoint,
            method: "GET",
            apiVersion: "CasinoGameLaunch",
        });

        if (response?.status === 200) {
            const url =
                response?.data?.gameUrl ||
                response?.data?.game_url ||
                response?.data?.token;

            if (!url) {
                return handleSessionExpired();
            }

            setNoStateGame(url);

            // Bitville handling
            if (response?.data?.aggregator?.toLowerCase() === "bitville") {
                // ✅ Update Context before rendering
                dispatch({
                    type: "SET",
                    key: "bitvilleGame",
                    payload: response.data,
                });

                setBitvilleGame(true);
            } else {
                setBitvilleGame(false);
            }
        } else {
            navigation.navigate("Casino" as never);
        }
    };

    /* ================= MAIN EFFECT ================= */
    useEffect(() => {

        if (!gameName) return;

        dispatch({
            type: "SET",
            key: "iscasinopage",
            payload: true
        });

        if (directLaunch.includes(gameName?.toLowerCase())) {

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
                            game?.game?.aggregator?.toLowerCase() === "bitville"
                        ) {
                            setBitvilleGame(true);
                        } else {
                            setBitvilleGame(false);
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

    }, [gameName, provider]); // 🔥 CRITICAL FIX

    /* ================= BITVILLE INJECTION ================= */
    const getInjectedJS = () => {
        if (!bitvilleGame || !state?.bitvilleGame) return "";

        return `
            (function() {
                var script = document.createElement('script');
                script.src = '${state?.bitvilleGame?.game_base_url}/js/BVComponents.min.js?v=1.1.0';
                script.async = true;

                script.onload = function() {
                    if (!window.bv || !window.bv.Parent) return;

                    var bvComponent = new window.bv.Parent(
                        "bv-loader",
                        "${state?.bitvilleGame?.game_base_url}/partner"
                    );

                    bvComponent.setParam("token", "${state?.bitvilleGame?.token}");
                    bvComponent.setParam("provider", "${state?.bitvilleGame?.provider}");
                    bvComponent.setParam("game", "${state?.bitvilleGame?.game}");
                    bvComponent.setParam("demoMode", "${state?.bitvilleGame?.demo}");
                    bvComponent.setParam("demoOverlay", "${state?.bitvilleGame?.demo_overlay}");
                    bvComponent.createComponent();

                    setTimeout(function() {
                        var container = document.getElementById("bv-loader");
                        if (container) {
                            container.style.height = window.innerHeight + "px";
                            container.style.width = "100%";
                        }

                        var iframes = document.getElementsByTagName("iframe");
                        for (var i = 0; i < iframes.length; i++) {
                            iframes[i].style.height = window.innerHeight + "px";
                            iframes[i].style.width = "100%";
                            iframes[i].style.border = "none";
                        }
                    }, 500);
                };

                document.body.appendChild(script);
            })();
            true;
        `;
    };

    /* ================= UI ================= */
    return (
        <View style={styles.container}>

            {!state?.fullcasinoscreen && (
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate("Casino" as never)
                        }
                    >
                        <Text style={styles.back}>
                            ← Back
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.gameContainer}>

                {bitvilleGame ? (

                    <WebView
                        key={`bitville-${gameName}`} // 🔥 FORCE RELOAD
                        originWhitelist={['*']}
                        source={{
                            html: `
                                <html>
                                    <head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        <style>
                                            html, body {
                                                margin: 0;
                                                padding: 0;
                                                height: 100%;
                                                width: 100%;
                                                background: #000;
                                                overflow: hidden;
                                            }
                                            #bv-loader {
                                                width: 100%;
                                                height: 100%;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <div id="bv-loader"></div>
                                    </body>
                                </html>
                            `
                        }}
                        injectedJavaScript={getInjectedJS()}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                        style={{ flex: 1 }}
                        scrollEnabled={false}
                    />

                ) : noStateGame ? (

                    <WebView
                        key={noStateGame} // 🔥 FORCE RELOAD
                        source={{ uri: noStateGame }}
                        style={{ flex: 1 }}
                        javaScriptEnabled
                        domStorageEnabled
                        allowsFullscreenVideo
                    />

                ) : (

                    <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
                        Loading Game...
                    </Text>

                )}

            </View>

        </View>
    );
};

export default React.memo(CasinoLaunchedGameScreen);

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