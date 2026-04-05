import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
interface Props {
  parentMatchId: string | number;
}

const MatchWidget: React.FC<Props> = ({ parentMatchId }) => {

  const html = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin:0;
            padding:0;
            background:#111;
            color:#fff;
          }
          .sr-widget {
            width:100%;
          }
          
        </style>
      </head>

      <body>
        <div class="widgets">
          <div class="sr-widget sr-widget-1"></div>
        </div>

        <script>
          function loadWidget() {
            if (!window.SIR) {
              var script = document.createElement("script");
              script.src = "https://widgets.sir.sportradar.com/d9d6a9c373db18dfdf63352e1c1d9321/widgetloader";
              script.async = true;
              script.setAttribute("n", "SIR");
              script.onload = function () {
                window.SIR("addWidget", ".sr-widget-1", "match.lmtPlus", {
                  streamToggle: "onPitchButton",
                  layout: "double",
                  detailedScoreboard: "disable",
                  tabsPosition: "top",
                  matchId: "${parentMatchId}"
                });
              };
              document.body.appendChild(script);
            }
          }

          loadWidget();
        </script>
      </body>
      </html>
    `;
  }, [parentMatchId]);

  return (
    <View style={styles.container} >
      <WebView
        originWhitelist={["*"]}
        source={{ html }
        }
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.webview}
      />
    </View>
  );
};

export default MatchWidget;

const styles = StyleSheet.create({
  container: {
    height: 280,
    width: "100%",
    backgroundColor: "#111",
  },
  webview: {
    flex: 1,
  },
});