import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

import OddButton from "./OddButton";

interface Props {
  match: any;
  live?: boolean;
  jackpot?: boolean;
}

/** Format like web: `15/09/26 - 15:15` */
const formatMatchStartTime = (startTime?: string) => {
  if (!startTime) return "-";
  const raw = String(startTime).trim();
  const parsed = new Date(
    raw.includes("T") || raw.includes("-") ? raw.replace(" ", "T") : raw
  );
  if (Number.isNaN(parsed.getTime())) return raw;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear()).slice(-2);
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

/** Mobile match card — mirrors live web `.mobile-match-card` */
const MatchRow: React.FC<Props> = ({ match, live, jackpot }) => {
  const navigation: any = useNavigation();

  const odds = match?.odds?.["1x2"]?.outcomes || [];
  const liveTime =
    match?.match_time === 0 || match?.match_time
      ? `${match?.match_time}`.includes("'")
        ? `${match?.match_time}`
        : `${match?.match_time}'`
      : "";

  const scoreParts = useMemo(() => {
    const raw = String(match?.score ?? "");
    if (!raw || !raw.includes(":")) return null;
    const [home, away] = raw.split(":");
    return { home: home?.trim() || "-", away: away?.trim() || "-" };
  }, [match?.score]);

  const sidebetsCount = Number(match?.sidebets) || 0;

  const metaLabel = live
    ? liveTime || match?.match_status || "LIVE"
    : formatMatchStartTime(match?.start_time);

  const openMatchDetails = useCallback(() => {
    if (jackpot) return;
    navigation.navigate("MatchAllMarketsScreen", {
      id: match?.match_id,
      live: live,
    });
  }, [jackpot, live, match?.match_id, navigation]);

  const openStats = useCallback(() => {
    const parentId = match?.parent_match_id;
    if (!parentId) return;
    void Linking.openURL(
      `https://s5.sir.sportradar.com/betmundialsmts/en/match/${parentId}`
    );
  }, [match?.parent_match_id]);

  return (
    <View style={styles.card}>
      <Text style={styles.metaText} numberOfLines={1}>
        {metaLabel}
        {" | ID: "}
        {match?.match_id || "-"}
      </Text>

      <View style={styles.midRow}>
        <TouchableOpacity
          style={styles.teams}
          onPress={openMatchDetails}
          activeOpacity={0.8}
        >
          <Text style={styles.team} numberOfLines={1}>
            {match?.home_team}
          </Text>
          <Text style={styles.team} numberOfLines={1}>
            {match?.away_team}
          </Text>
        </TouchableOpacity>

        {live && scoreParts ? (
          <View style={styles.scoreCol}>
            <Text style={styles.scoreText}>{scoreParts.home}</Text>
            <Text style={styles.scoreText}>{scoreParts.away}</Text>
          </View>
        ) : null}

        {!jackpot ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={openStats}
              accessibilityLabel="Match statistics"
              activeOpacity={0.85}
            >
              <Ionicons name="stats-chart" size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.marketsBtn]}
              onPress={openMatchDetails}
              activeOpacity={0.85}
            >
              <Text style={styles.marketsText}>{sidebetsCount}+</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={styles.marketBar}>
        <Text style={styles.marketLabel}>3 WAY</Text>
      </View>

      <View style={styles.oddsRow}>
        {odds.map((odd: any, index: number) => {
          const oddMatch = {
            ...match,
            odd_key: odd?.odd_key || odd?.name || odd?.label,
            odd_value: odd?.price || odd?.odd_value,
            outcome_id: odd?.outcome_id,
            special_bet_value: odd?.special_bet_value,
            sub_type_id: odd?.sub_type_id || match?.sub_type_id,
            name: "1x2",
            market_name: "1x2",
          };

          return (
            <OddButton
              key={`${odd?.odd_key}-${odd?.outcome_id}-${match?.match_id}`}
              match={oddMatch}
              mkt="1x2"
              live={live}
              listing
              last={index === odds.length - 1}
            />
          );
        })}
      </View>
    </View>
  );
};

export default MatchRow;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingTop: 10,
    paddingHorizontal: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  metaText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 6,
  },
  midRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  teams: {
    flex: 1,
    minWidth: 0,
  },
  team: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  scoreCol: {
    marginHorizontal: 4,
    alignItems: "center",
    flexShrink: 0,
  },
  scoreText: {
    color: "#FFB200",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 16,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    minWidth: 36,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  marketsBtn: {
    minWidth: 40,
  },
  marketsText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 16,
  },
  marketBar: {
    backgroundColor: "rgba(10,22,45,0.69)",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  marketLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  oddsRow: {
    flexDirection: "row",
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: "hidden",
  },
});
