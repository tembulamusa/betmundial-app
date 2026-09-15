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

const WIDGET_CLIENT_ID = "d9d6a9c373db18dfdf63352e1c1d9321";
const WIDGET_LOAD_TIMEOUT_MS = 15000;
const WIDGET_BG = "#0f0f1f";

/**
 * Betradar LMT Premium area — mirrors web `match-widget.js` /
 * `.match-widget-container` + SportPesa-style fallback team names.
 */
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: ${WIDGET_BG};
      color: #fff;
      min-height: 100%;
      overflow-x: hidden;
    }
    .widgets, .match-widget-container, #sr-widget, .sr-widget {
      width: 100%;
      min-height: 160px;
      background: ${WIDGET_BG};
    }
    .sr-bb { width: 100% !important; }
  </style>
</head>
<body>
  <div class="widgets match-widget-container">
    <div id="sr-widget" class="sr-widget"></div>
  </div>
  <script>
    function post(type) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
      }
    }

    function widgetHasContent(rootEl) {
      if (!rootEl) return false;
      return Boolean(
        rootEl.querySelector(".sr-bb, .sr-lmt, iframe, canvas, svg") ||
        (rootEl.childElementCount > 0 && (rootEl.textContent || "").trim().length > 0)
      );
    }

    function initWidget() {
      var matchId = "${matchId}";
      if (!matchId) {
        post("widget_unavailable");
        return;
      }

      function addWidget() {
        try {
          window.SIR("addWidget", "#sr-widget", "match.lmtPlus", {
            matchId: isFinite(Number(matchId)) ? Number(matchId) : matchId,
            enableVirtualised: true,
            vlmtForce2d: false,
            enableDataStream: true,
            streamToggle: "onPitchButton",
            layout: "double",
            detailedScoreboard: "disable",
            tabsPosition: "top",
            onTrack: function (eventType, data) {
              if (eventType === "error" || (eventType === "data_change" && data && data.error)) {
                post("widget_error");
              }
            }
          });

          setTimeout(function () {
            post(widgetHasContent(document.getElementById("sr-widget"))
              ? "widget_loaded"
              : "widget_unavailable");
          }, 8000);
        } catch (err) {
          post("widget_error");
        }
      }

      if (!window.SIR) {
        var script = document.createElement("script");
        script.src = "https://widgets.sir.sportradar.com/${WIDGET_CLIENT_ID}/widgetloader";
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

    const liveTimeLabel =
        matchTime && live
            ? `${matchTime}`.includes("'")
                ? `${matchTime}`
                : `${matchTime}'`
            : "";

    // Web SportPesa-style fallback: centered "Home - Away" (no "vs")
    if (!parentMatchId || status === "unavailable") {
        return (
            <View style={styles.fallback}>
                <Text style={styles.fallbackTeam} numberOfLines={3}>
                    {homeTeam || "Home"}
                </Text>
                <Text style={styles.fallbackSep}>-</Text>
                <Text style={styles.fallbackTeam} numberOfLines={3}>
                    {awayTeam || "Away"}
                </Text>
                {live && (score || liveTimeLabel) ? (
                    <View style={styles.fallbackLiveMeta}>
                        {liveTimeLabel ? (
                            <Text style={styles.fallbackLiveText}>{liveTimeLabel}</Text>
                        ) : null}
                        {score ? (
                            <Text style={styles.fallbackScore}>{score}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
                    <Text style={styles.loadingText}>Loading match centre...</Text>
                </View>
            ) : null}
        </View>
    );
};

export default MatchWidget;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        minHeight: 160,
        backgroundColor: WIDGET_BG,
        overflow: "hidden",
    },
    webview: {
        width: "100%",
        minHeight: 280,
        backgroundColor: WIDGET_BG,
    },
    webviewHidden: {
        opacity: 0,
        height: 0,
        minHeight: 0,
    },
    loadingOverlay: {
        minHeight: 160,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: WIDGET_BG,
        gap: 8,
        paddingVertical: 28,
    },
    loadingText: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 12,
    },
    fallback: {
        width: "100%",
        minHeight: 160,
        backgroundColor: WIDGET_BG,
        paddingHorizontal: 16,
        paddingVertical: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 10,
    },
    fallbackTeam: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
        lineHeight: 20,
        letterSpacing: 0.1,
        textAlign: "center",
        maxWidth: "42%",
    },
    fallbackSep: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 16,
        fontWeight: "700",
        lineHeight: 24,
    },
    fallbackLiveMeta: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginTop: 8,
    },
    fallbackLiveText: {
        color: "#86efac",
        fontSize: 12,
        fontWeight: "600",
    },
    fallbackScore: {
        color: "#FFD700",
        fontSize: 14,
        fontWeight: "700",
    },
});
