import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Linking
} from "react-native";

import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useNavigation, useRoute } from "@react-navigation/native";
import { makeRequest } from "../utils/makeRequest";
import { Context } from "../../context/store";
import { theme } from "../../theme";

import InAppBrowser from "react-native-inappbrowser-reborn";
import { getItem } from "../utils/local-storage";

const CasinoLaunchedGameScreen = () => {

    const [state, dispatch] = useContext(Context);
    const navigation: any = useNavigation();
    const route: any = useRoute();

    const provider = route?.params?.provider;
    const gameName = route?.params?.game;

    const [gameUrl, setGameUrl] = useState<string | null>(null);
    const [bitvilleGame, setBitvilleGame] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const directLaunch = ["mundial-league", "aviator", "jetx", "aviatrix"];
    const launchedGameKey = `${provider || "provider"}-${gameName || "game"}`;

    /* ================= SESSION EXPIRED ================= */
    const handleSessionExpired = async () => {
        await AsyncStorage.multiRemove(["user", "casinolaunch"]);

        dispatch({ type: "DEL", key: "user" });

        dispatch({ type: "SET", key: "showloginmodal", payload: true });

        dispatch({
            type: "SET",
            key: "sessionMessage",
            payload: "Session expired. Please log in again."
        });

        navigation.navigate("Casino");
    };

    /* ================= OPEN IN APP BROWSER ================= */
    const openInAppBrowser = async (url: string) => {
        try {
            if (await InAppBrowser.isAvailable()) {
                await InAppBrowser.open(url, {
                    dismissButtonStyle: 'close',
                    preferredBarTintColor: theme.background,
                    preferredControlTintColor: '#fff',
                    readerMode: false,
                    animated: true,
                    modalPresentationStyle: 'fullScreen',
                });
            } else {
                Alert.alert("Info", "Opening in external browser");
                Linking.openURL(url);
            }
        } catch (err) {
            console.log("INAPPBROWSER ERROR:", err);
            Alert.alert("Error", "Unable to open game");
        }
    };

    /* ================= FETCH GAME URL ================= */
    const fetchGameUrl = async (endpoint: string) => {
        try {
            const res = await makeRequest({
                url: endpoint,
                method: "GET",
                apiVersion: "CasinoGameLaunch",
            });

            if (res?.status === 200) {
                const data = res?.data;

                const url =
                    data?.gameUrl ||
                    data?.game_url ||
                    data?.token;

                if (!url || typeof url !== "string" || url.trim() === "") {
                    Alert.alert("Error", "Invalid game URL");
                    return handleSessionExpired();
                }


                setGameUrl(url);

                // ✅ MATCH WEB (FULL OBJECT)
                if (data?.aggregator?.toLowerCase() === "bitville") {
                    dispatch({
                        type: "SET",
                        key: "bitvilleGame",
                        payload: data,
                    });
                    setBitvilleGame(data);
                } else {
                    setBitvilleGame(null);
                }

            } else {
                Alert.alert("Error", "Failed to fetch game");
                navigation.navigate("Casino");
            }

        } catch (err) {
            console.log("FETCH ERROR:", err);
            Alert.alert("Error", "Game launch failed");
            navigation.navigate("Casino");
        } finally {
            setLoading(false);
        }
    };

    /* ================= DIRECT LAUNCH ================= */
    const launchDirectGame = () => {

        let endpoint = "Unicraft/casino/game-url/mobile/1/uicraftvirtuals";

        if (gameName?.toLowerCase() === "aviator") {
            endpoint = "Bitville/casino/game-url/mobile/1/1370";
        }

        if (gameName?.toLowerCase() === "jetx") {
            endpoint = "SmartSoft/casino/game-url/mobile/1/13";
        }

        if (gameName?.toLowerCase() === "aviatrix") {
            endpoint = "Aviatrix/casino/game-url/mobile/1/nft-aviatrix";
        }

        fetchGameUrl(endpoint);
    };

    /* ================= MAIN EFFECT ================= */
    useEffect(() => {
        if (!gameName || !provider) {
            setLoading(false);
            return;
        }

        setGameUrl(null);
        setBitvilleGame(null);
        setLoading(true);

        dispatch({
            type: "SET",
            key: "iscasinopage",
            payload: true
        });

        if (directLaunch.includes(gameName.toLowerCase())) {
            launchDirectGame();
        } else {
            const loadCasinoLaunch = async () => {
                try {
                    let stored = await getItem("casinolaunch");

                    let parsed: any = null;

                    if (stored) {
                        parsed = typeof stored === "string" ? JSON.parse(stored) : stored;
                    } else if (state?.casinolaunch) {
                        parsed = state.casinolaunch;
                    }

                    if (!parsed) {
                        return handleSessionExpired();
                    }

                    const url =
                        parsed?.url ||
                        parsed?.game?.token ||
                        parsed?.gameUrl ||
                        parsed?.game?.game_url;

                    if (!url || typeof url !== "string" || url.trim() === "") {
                        return handleSessionExpired();
                    }

                    // const blockedGames = ["aviator", "jetx", "aviatrix"];
                    // if (blockedGames.includes(gameName?.toLowerCase())) {
                    //     return openInAppBrowser(url);
                    // }

                    setGameUrl(url);

                    // ✅ MATCH WEB (FULL OBJECT)
                    if (
                        parsed?.aggregator?.toLowerCase() === "bitville" ||
                        parsed?.game?.aggregator?.toLowerCase() === "bitville"
                    ) {
                        setBitvilleGame(parsed);
                    }

                } catch (err) {
                    console.log("STORAGE ERROR:", err);
                    handleSessionExpired();
                } finally {
                    setTimeout(() => setLoading(false), 100);
                }
            };

            loadCasinoLaunch();
        }

        return () => {
            dispatch({ type: "DEL", key: "iscasinopage" });
        };

    }, [gameName, provider]);

    /* ================= CLEANUP ================= */
    useEffect(() => {
        return () => {
            dispatch({ type: "DEL", key: "casinolaunch" });
            dispatch({ type: "DEL", key: "bitvilleGame" });
            AsyncStorage.multiRemove(["casinolaunch"]);
        };
    }, [gameUrl]);

    /* ================= BITVILLE JS ================= */
    const getInjectedJS = () => {

        if (!bitvilleGame) return "";

        return `
            (function() {
                var script = document.createElement('script');
                script.src = '${bitvilleGame?.game_base_url}/js/BVComponents.min.js?v=1.1.0';

                script.onload = function() {
                    if (!window.bv || !window.bv.Parent) return;

                    var bvComponent = new window.bv.Parent(
                        "bv-loader",
                        "${bitvilleGame?.game_base_url}/partner"
                    );

                    bvComponent.setParam("token", "${bitvilleGame?.token}");
                    bvComponent.setParam("provider", "${bitvilleGame?.provider}");
                    bvComponent.setParam("game", "${bitvilleGame?.game}");
                    bvComponent.setParam("demoMode", "${bitvilleGame?.demo}");
                    bvComponent.setParam("demoOverlay", "${bitvilleGame?.demo_overlay}");

                    bvComponent.createComponent();
                };

                document.body.appendChild(script);
            })();
            true;
        `;
    };

    /* ================= UI ================= */
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← Back</Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <View>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
            {gameUrl && (bitvilleGame ?
                <WebView
                    key={`bitville-${launchedGameKey}`}
                    originWhitelist={['*']}
                    source={{
                        html: `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>
              html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                background: black;
                overflow: hidden;
              }

              #bv-loader {
                width: 100%;
                height: 100%;
              }

              #bv-loader iframe {
                width: 100%;
                height: 100%;
                border: 0;
              }
            </style>
          </head>
          <body>
            <div id="bv-loader" style={{ width: '100%', height: '100%' }}></div>
          </body>
        </html>
        `
                    }}
                    injectedJavaScript={getInjectedJS()}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsFullscreenVideo
                    style={{ flex: 1 }}
                    containerStyle={{ flex: 1 }}
                    onError={() => {
                        if (gameUrl) openInAppBrowser(gameUrl);
                    }}
                />
                : <WebView
                    source={{ uri: gameUrl }}
                    originWhitelist={['*']}
                    javaScriptEnabled
                    key={`nobit-${launchedGameKey}`}
                    domStorageEnabled
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                    allowsFullscreenVideo
                    mixedContentMode="always"
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    startInLoadingState
                    onError={() => openInAppBrowser(gameUrl)}
                    style={{ flex: 1 }}
                />
            )
            }
            {!loading && !gameUrl && (
                <Text style={styles.error}>
                    Failed to load game
                </Text>
            )}

        </View >
    );
};

export default React.memo(CasinoLaunchedGameScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        padding: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    back: {
        color: "#fff",
        fontSize: 16
    },
    gameContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    error: {
        color: "#fff",
        textAlign: "center"
    }
});
