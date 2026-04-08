import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import OddButton from "./OddButton";
// import Alert from "../utils/Alert";

interface Props {
  match: any;
  live?: boolean;
  jackpot?: boolean;
}

const MatchRow: React.FC<Props> = ({ match, live, jackpot }) => {

  const navigation: any = useNavigation();

  const odds = match?.odds?.["1x2"]?.outcomes || [];
  const liveTime =
    match?.match_time === 0 || match?.match_time
      ? `${match?.match_time}`.includes("'")
        ? `${match?.match_time}`
        : `${match?.match_time}'`
      : "";

  const openMatchDetails = () => {
    if (jackpot) {
      return;
    }
    navigation.navigate("MatchAllMarketsScreen", {
      id: match?.match_id,
      live: live,
    });
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.teams} onPress={openMatchDetails}>
        <Text style={styles.team}>{match?.home_team}</Text>
        <Text style={styles.team}>{match?.away_team}</Text>
      </TouchableOpacity>

      {live && (
        <View style={styles.liveStatus}>
          {liveTime ? (
            <Text style={styles.liveTimeText}>
              {liveTime}
            </Text>
          ) : null}
          <Text style={styles.scoreText}>
            {match?.score || "-"}
          </Text>

        </View>
      )}

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

      <View style={styles.bottomRow}>
        <View style={styles.matchMeta}>
          <Text style={styles.metaText} numberOfLines={1}>
            {match?.category || "-"} | {match?.competition_name || "-"}
          </Text>
          <Text style={styles.metaSubText}>
            {match?.start_time || "-"}
          </Text>
        </View>

        <View style={styles.bottomRight}>
          <TouchableOpacity onPress={openMatchDetails}>
            {match?.sidebets > 0 && !jackpot && (
              <Text style={styles.moreMarkets}>
                +{match?.sidebets || 0}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.liveIcon}>📊</Text>
        </View>
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

  liveStatus: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  scoreText: {
    color: "#ffcc00",
    fontWeight: "700",
  },

  liveTimeText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
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
    justifyContent: "space-between",
    alignItems: "center",
  },

  matchMeta: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    paddingRight: 8,
  },

  metaText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },

  metaSubText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "700",
  },

  bottomRight: {
    flexDirection: "column",
    alignItems: "center",
  },

  moreMarkets: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },

  liveIcon: {
    fontSize: 14,
  },

});
