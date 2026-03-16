import React, { use, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import OddButton from "./OddButton";

interface Props {
  match: any;
  live?: boolean;
  jackpot?: boolean;
}

const MatchRow: React.FC<Props> = ({ match, live, jackpot }) => {

  const navigation: any = useNavigation();

  const odds = match?.odds?.["1x2"]?.outcomes || [];

  const openMatchDetails = () => {
    if (jackpot) {
      return;
    }
    navigation.navigate("MatchAllMarketsScreen", {
      id: match?.match_id,
    });
  };

  return (
    <View style={styles.row}>

      {/* Teams */}
      <TouchableOpacity style={styles.teams} onPress={openMatchDetails}>
        <Text style={styles.team}>{match?.home_team}</Text>
        <Text style={styles.team}>{match?.away_team}</Text>
      </TouchableOpacity>

      {/* Score (logic preserved) */}
      {live && (
        <View style={styles.score}>
          <Text style={styles.scoreText}>
            {match?.score || "-"}
          </Text>
        </View>
      )}

      {/* Odds buttons */}
      <View style={styles.oddsRow}>
        {odds.map((odd: any) => {

          const oddMatch = {
            ...match,
            odd_key: odd?.odd_key || odd?.name || odd?.label,
            odd_value: odd?.price || odd?.odd_value,
            outcome_id: odd?.outcome_id,
            special_bet_value: odd?.special_bet_value,
            sub_type_id: odd?.sub_type_id || match?.sub_type_id,
          };

          return (
            <View
              key={odd?.odd_key + "" + match?.match_id}
              style={styles.button}
            >
              <OddButton
                match={oddMatch}
                mkt="odd_key"
                live={live}
              />
            </View>
          );
        })}
      </View>

      {/* Bottom row UI from new design */}
      <View style={styles.bottomRow}>
        {match?.sidebets > 0 && !jackpot && (
          <Text style={styles.moreMarkets}>
            +{match?.sidebets || 0}
          </Text>)}

        {
          <Text style={styles.liveIcon}>📊</Text>
        }
      </View>

    </View>
  );
};

export default MatchRow;

const styles = StyleSheet.create({

  row: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 12,
    marginBottom: 6,
    borderRadius: 6,
  },

  teams: {
    marginBottom: 8,
  },

  team: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  score: {
    position: "absolute",
    right: 10,
    top: 10,
  },

  scoreText: {
    color: "#ffcc00",
    fontWeight: "700",
  },

  oddsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  button: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: 2,
  },

  bottomRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  moreMarkets: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },

  liveIcon: {
    fontSize: 14,
  },

});