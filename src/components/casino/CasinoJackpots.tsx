import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable
} from "react-native";

import makeRequest from "../../utils/fetch-request";
import { Context } from "../../../context/store";

interface Jackpot {
  id: string;
  name: string;
  level: string;
  tier: number;
  amount: number;
  stats: any;
}

const tierColors = [
  { name: "BRONZE", text: "#e5e7eb", bg: "#111827" },
  { name: "SILVER", text: "#e5e7eb", bg: "#020617" },
  { name: "GOLD", text: "#e5e7eb", bg: "#111827" },
  { name: "PLATINUM", text: "#e5e7eb", bg: "#020617" }
];

const CasinoJackpots: React.FC = () => {

  const [state, dispatch] = useContext(Context);

  const [jackpots, setJackpots] = useState < Jackpot[] > ([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedJackpot, setSelectedJackpot] = useState < Jackpot | null > (null);

  const fetchCasinoJackpots = async () => {

    const [status, result] = await makeRequest({
      url: "/jackpots",
      method: "GET",
      api_version: "casinoJackpots"
    });

    if (status === 200) {

      const flattenedJackpots = result.jackpots.flatMap((jackpot: any) =>
        jackpot.tiers.map((tier: any, index: number) => ({
          id: `${jackpot.jackpotName}-tier-${index}`,
          name: jackpot.jackpotName,
          level: jackpot.level,
          tier: tier.tier,
          amount: tier.amount,
          stats: {
            biggestWinAmount: tier.biggestWinAmount || "N/A",
            lastWinAmount: tier.lastWinAmount || "N/A",
            numberOfWins: tier.numberOfWins || "N/A",
            lastWinDate: tier.lastWinDate || null
          }
        }))
      );

      dispatch({
        type: "SET",
        key: "pragmaticJackpots",
        payload: flattenedJackpots
      });
    }
  };

  useEffect(() => {
    fetchCasinoJackpots();
  }, []);

  useEffect(() => {
    if (state?.pragmaticJackpots) {
      setJackpots(state.pragmaticJackpots);
    }
  }, [state?.pragmaticJackpots]);

  useEffect(() => {

    if (!jackpots.length) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % jackpots.length);
    }, 6000);

    return () => clearInterval(interval);

  }, [jackpots.length]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % jackpots.length);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + jackpots.length) % jackpots.length);
  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>Casino Jackpots</Text>

      <View style={styles.cardsContainer}>

        {jackpots.map((jackpot, index) => {

          const isActive = index === currentIndex;
          const tier = tierColors[jackpot.tier] || tierColors[0];

          return (

            <TouchableOpacity
              key={jackpot.id}
              style={[
                styles.card,
                { backgroundColor: tier.bg },
                isActive && styles.activeCard
              ]}
              onPress={() => setSelectedJackpot(jackpot)}
            >

              <Text style={[styles.tierText, { color: tier.text }]}>
                {tier.name || jackpot.name}
              </Text>

              <Text style={styles.amount}>
                KES {Number(jackpot.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
              </Text>

            </TouchableOpacity>

          );
        })}

      </View>

      {/* Tooltip Modal */}

      <Modal
        transparent
        visible={!!selectedJackpot}
        animationType="fade"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedJackpot(null)}
        >

          <View style={styles.tooltip}>

            <Text style={styles.tooltipText}>
              Total Winners: {selectedJackpot?.stats?.numberOfWins ?? "N/A"}
            </Text>

            <Text style={styles.tooltipText}>
              Biggest Win: {selectedJackpot?.stats?.biggestWinAmount ?? "N/A"}
            </Text>

            <Text style={styles.tooltipText}>
              Last Win: {selectedJackpot?.stats?.lastWinAmount ?? "N/A"}
            </Text>

            <Text style={styles.tooltipText}>
              Last Won: {
                selectedJackpot?.stats?.lastWinDate
                  ? new Date(selectedJackpot.stats.lastWinDate)
                    .toLocaleDateString("en-GB")
                  : "N/A"
              }
            </Text>

          </View>

        </Pressable>

      </Modal>

    </View>
  );
};

export default React.memo(CasinoJackpots);

const styles = StyleSheet.create({

  container: {
    padding: 16,
    backgroundColor: "#0f172a"
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#f97316",
    marginBottom: 12
  },

  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    width: "48%"
  },

  activeCard: {
    borderWidth: 2,
    borderColor: "#f97316"
  },

  tierText: {
    fontSize: 16,
    fontWeight: "600"
  },

  amount: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
    color: "#fff"
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center"
  },

  tooltip: {
    backgroundColor: "#020617",
    padding: 20,
    borderRadius: 10,
    width: "80%"
  },

  tooltipText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6
  }

});