import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import OddButton from "./OddButton";
import { Context } from "../../context/store";

interface Props {
  match: any;
  live?: boolean;
}

const MatchRow: React.FC<Props> = ({ match, live }) => {

  const navigation: any = useNavigation();
  const odds = match?.odds?.["1x2"]?.outcomes || [];

  const openMatchDetails = () => {
    navigation.navigate("MatchAllMarketsScreen", {
      id: match?.match_id
    });
  };

  return (
    <View style={styles.row}>

      <TouchableOpacity style={styles.teams} onPress={openMatchDetails}>
        <Text style={styles.team}>{match.home_team}</Text>
        <Text style={styles.team}>{match.away_team}</Text>
      </TouchableOpacity>

      {live && (
        <View style={styles.score}>
          <Text style={styles.scoreText}>
            {match.score || "-"}
          </Text>
        </View>
      )}

      <View style={styles.marketContainer}>
        <View style={styles.oddsRow}>
          {odds.map((odd: any) => {

            const oddMatch = {
              ...match,
              odd_key: odd?.odd_key || odd?.name || odd?.label,
              odd_value: odd?.price || odd?.odd_value,
              outcome_id: odd?.outcome_id,
              special_bet_value: odd?.special_bet_value,
              sub_type_id: odd?.sub_type_id || "1x2"
            };

            return (
              <View key={odd?.odd_key + "" + match?.match_id}
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

      </View>

    </View>
  );
};

export default MatchRow;

const styles = StyleSheet.create({

  row: {
    backgroundColor: "#111",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222"
  },

  teams: {
    marginBottom: 10
  },

  team: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },

  score: {
    position: "absolute",
    right: 10,
    top: 10
  },

  scoreText: {
    color: "#ffcc00",
    fontWeight: "700"
  },

  marketContainer: {
    marginTop: 10
  },

  oddsRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  }

});