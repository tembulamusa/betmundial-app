import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

type WidgetStatus = "loading" | "loaded" | "unavailable";

interface Props {
    parentMatchId?: string | number | null;
    homeTeam?: string;
    awayTeam?: string;
    score?: string;
    matchTime?: string;
    live?: boolean;
}

const WIDGET_LOAD_TIMEOUT_MS = 12000;

const MatchWidget: React.FC<Props> = ({
    parentMatchId,
    homeTeam,
    awayTeam,
    score,
    matchTime,
    live,
}) => {
    const [status, setStatus] = useState<WidgetStatus>("loading");
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearLoadTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const markUnavailable = useCallback(() => {
        clearLoadTimeout();
        setStatus("unavailable");
    }, [clearLoadTimeout]);

    const markLoaded = useCallback(() => {
        clearLoadTimeout();
        setStatus("loaded");
    }, [clearLoadTimeout]);

    useEffect(() => {
        clearLoadTimeout();

        if (!parentMatchId) {
            setStatus("unavailable");
            return;
        }

        setStatus("loading");
        timeoutRef.current = setTimeout(markUnavailable, WIDGET_LOAD_TIMEOUT_MS);

        return clearLoadTimeout;
    }, [parentMatchId, clearLoadTimeout, markUnavailable]);

    const html = useMemo(() => {
        const matchId = String(parentMatchId ?? "");

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background: #111;
            color: #fff;
            min-height: 100%;
          }
          .widgets {
            width: 100%;
            min-height: 240px;
          }
          .sr-widget {
            width: 100%;
            min-height: 240px;
          }
        </style>
      </head>
      <body>
        <div class="widgets">
          <div class="sr-widget sr-widget-1"></div>
        </div>
        <script>
          function post(type) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
            }
          }

          function initWidget() {
            var matchId = "${matchId}";
            if (!matchId) {
              post("widget_unavailable");
              return;
            }

            function addWidget() {
              try {
                window.SIR("addWidget", ".sr-widget-1", "match.lmtPlus", {
                  streamToggle: "onPitchButton",
                  layout: "double",
                  detailedScoreboard: "disable",
                  tabsPosition: "top",
                  matchId: matchId
                });

                setTimeout(function () {
                  var el = document.querySelector(".sr-widget-1");
                  var hasContent = el && el.children && el.children.length > 0;
                  post(hasContent ? "widget_loaded" : "widget_unavailable");
                }, 7000);
              } catch (err) {
                post("widget_error");
              }
            }

            if (!window.SIR) {
              var script = document.createElement("script");
              script.src = "https://widgets.sir.sportradar.com/d9d6a9c373db18dfdf63352e1c1d9321/widgetloader";
              script.async = true;
              script.setAttribute("n", "SIR");
              script.onload = addWidget;
              script.onerror = function () { post("widget_error"); };
              document.body.appendChild(script);
            } else {
              addWidget();
            }
          }

          initWidget();
        </script>
      </body>
      </html>
    `;
    }, [parentMatchId]);

    const onWebViewMessage = useCallback(
        (event: WebViewMessageEvent) => {
            try {
                const payload = JSON.parse(event.nativeEvent.data);
                if (payload?.type === "widget_loaded") {
                    markLoaded();
                } else if (
                    payload?.type === "widget_unavailable" ||
                    payload?.type === "widget_error"
                ) {
                    markUnavailable();
                }
            } catch {
                markUnavailable();
            }
        },
        [markLoaded, markUnavailable]
    );

    const teamLine =
        homeTeam && awayTeam
            ? `${homeTeam} vs ${awayTeam}`
            : homeTeam || awayTeam || "Match";

    const liveTimeLabel =
        matchTime && live
            ? `${matchTime}`.includes("'")
                ? `${matchTime}`
                : `${matchTime}'`
            : "";

    if (!parentMatchId || status === "unavailable") {
        return (
            <View style={styles.fallback}>
                <Text style={styles.fallbackTeams} numberOfLines={2}>
                    {teamLine}
                </Text>
                {(score || liveTimeLabel) ? (
                    <View style={styles.fallbackMetaRow}>
                        {liveTimeLabel ? (
                            <Text style={styles.fallbackMeta}>{liveTimeLabel}</Text>
                        ) : null}
                        {score ? (
                            <Text style={styles.fallbackScore}>{score}</Text>
                        ) : null}
                    </View>
                ) : null}
                <Text style={styles.fallbackNotice}>
                    Live stats widget is not reachable right now.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.teamsBar}>
                <Text style={styles.teamsBarText} numberOfLines={1}>
                    {teamLine}
                </Text>
                {(score || liveTimeLabel) ? (
                    <View style={styles.teamsBarMeta}>
                        {liveTimeLabel ? (
                            <Text style={styles.teamsBarMetaText}>{liveTimeLabel}</Text>
                        ) : null}
                        {score ? (
                            <Text style={styles.teamsBarScore}>{score}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>

            <WebView
                key={String(parentMatchId)}
                originWhitelist={["*"]}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="always"
                allowsInlineMediaPlayback
                setSupportMultipleWindows={false}
                onMessage={onWebViewMessage}
                onError={markUnavailable}
                onHttpError={markUnavailable}
                style={[
                    styles.webview,
                    status !== "loaded" && styles.webviewHidden,
                ]}
            />

            {status === "loading" ? (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.loadingText}>Loading live stats...</Text>
                </View>
            ) : null}
        </View>
    );
};

export default MatchWidget;

const styles = StyleSheet.create({
    container: {
        minHeight: 280,
        width: "100%",
        backgroundColor: "#111",
    },
    webview: {
        flex: 1,
        minHeight: 240,
        backgroundColor: "#111",
    },
    webviewHidden: {
        opacity: 0,
        height: 0,
        minHeight: 0,
    },
    teamsBar: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        gap: 4,
    },
    teamsBarText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    teamsBarMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    teamsBarMetaText: {
        color: "#86efac",
        fontSize: 12,
        fontWeight: "600",
    },
    teamsBarScore: {
        color: "#FFD700",
        fontSize: 13,
        fontWeight: "700",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        top: 52,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(17,17,17,0.92)",
        gap: 8,
    },
    loadingText: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 12,
    },
    fallback: {
        width: "100%",
        backgroundColor: "#111",
        paddingHorizontal: 14,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        gap: 8,
    },
    fallbackTeams: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        lineHeight: 20,
    },
    fallbackMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    fallbackMeta: {
        color: "#86efac",
        fontSize: 12,
        fontWeight: "600",
    },
    fallbackScore: {
        color: "#FFD700",
        fontSize: 14,
        fontWeight: "700",
    },
    fallbackNotice: {
        color: "rgba(255,255,255,0.55)",
        fontSize: 12,
        lineHeight: 17,
        marginTop: 2,
    },
});
