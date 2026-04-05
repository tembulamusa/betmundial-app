import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Context } from "../../context/store";
import BetSlip from "./Betslip";
import Float from "../utils/mathematical-formulas";
import { getItem } from "../utils/local-storage";

interface Props {
  betslipValidationData?: any;
  jackpotData?: any;
  footerOffset?: number; // distance from bottom (tab bar height)
}

const BetslipIndex: React.FC<Props> = ({
  betslipValidationData,
  jackpotData,
  footerOffset = 60,
}) => {
  const [state, dispatch] = useContext(Context);
  const [bongeBonusMessage] = useState("Select 3 or more games to win big bonus");
  const [showBetslip, setShowBetslip] = useState(false);

  // Show loading placeholder immediately, then load the heavy component
  useEffect(() => {
    if (state?.showmobileslip && !showBetslip) {
      // Show placeholder first
      const timer = setTimeout(() => {
        setShowBetslip(true);
      }, 200); // 200ms placeholder before heavy component loads

      return () => clearTimeout(timer);
    } else if (!state?.showmobileslip) {
      // Reset when modal closes
      setShowBetslip(false);
    }
  }, [state?.showmobileslip, showBetslip]);

  const showShareModalDialog = () => {
    const loggedInUser = getItem("user") ?? null;
    if (!loggedInUser) {
      dispatch({ type: "SET", key: "showloginmodal", payload: true });
    } else {
      dispatch({ type: "SET", key: "showsharemodal", payload: true });
    }
  };

  const BongeBetMarkupMessage = () => {
    if (!state?.isjackpot && Object.keys(state?.betslip || {}).length > 0) {
      return <View style={styles.bonusBox}><Text>{bongeBonusMessage}</Text></View>;
    }
    return null;
  };

  const BetslipPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderHeader}>
        <Text style={styles.placeholderTitle}>
          {state?.isjackpot ? "Jackpot" : "Betslip"}
        </Text>
      </View>
      <View style={styles.placeholderContent}>
        <ActivityIndicator size="large" color="#a71f66" />
        <Text style={styles.placeholderText}>Loading betslip...</Text>
        <Text style={styles.placeholderSubtext}>
          Preparing your selections
        </Text>
      </View>
    </View>
  );

  const MobileSlipHeader = () => (
    <View style={styles.modalHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.modalTitle}>{state?.isjackpot ? "Jackpot" : "Betslip"}</Text>
        {!state?.isjackpot && <Text style={styles.counter}>({Object?.keys(state?.betslip || {})?.length})</Text>}
      </View>
      <View style={styles.headerActions}>
        {Object.keys(state?.betslip || {}).length > 0 && (
          <TouchableOpacity style={styles.shareBtn} onPress={showShareModalDialog}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => dispatch({ type: "SET", key: "showmobileslip", payload: false })}
        >
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* MODAL */}
      <Modal
        visible={!!state?.showmobileslip}
        animationType="slide"
        transparent={false}>
        <View style={styles.modalContainer}>
          <MobileSlipHeader />
          <ScrollView style={styles.modalBody}>
            <View style={styles.betslipContainer}>
              {!showBetslip ? (
                <BetslipPlaceholder />
              ) : (
                <>
                  {Object.keys(state?.betslip || {}).length === 0 && <BongeBetMarkupMessage />}
                  <BetSlip
                    jackpot={state?.isjackpot}
                    betslipValidationData={betslipValidationData}
                    jackpotData={jackpotData}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* FOOTER ABOVE TABS */}
      {/* {Object?.keys(state?.betslip || state?.jackpotbetslip || {})?.length > 0 && (
        <View style={[styles.footer, { bottom: footerOffset }]}>
          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => dispatch({ type: "SET", key: "showmobileslip", payload: true })}
          >
            <Text style={styles.footerText}>
              Slip ({Object.entries(state?.betslip || state?.jackpotbetslip || {}).length})
            </Text>
          </TouchableOpacity>

          <View style={styles.footerItem}>
            {state?.isjackpot ? (
              <Text>Stake: {state?.jackpotdata?.bet_amount}</Text>
            ) : (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(state?.mobilefooteramount ?? 100)}
                onChangeText={(val) => dispatch({ type: "SET", key: "mobilefooteramount", payload: val })}
              />
            )}
          </View>

          <View style={styles.footerItem}>
            {!state?.isjackpot && <Text>Odds: {Float(state?.totalodds, 2) || 1}</Text>}
            <Text>
              Win: {state?.isjackpot ? state?.jackpotdata?.jackpot_amount : state?.slipnetwin}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.betButton}
            onPress={() => dispatch({ type: "SET", key: "showmobileslip", payload: true })}
          >
            <Text style={styles.betButtonText}>Bet Now</Text>
          </TouchableOpacity>
        </View>
      )
      } */}
    </View>
  );
};

export default BetslipIndex;

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#0f0f1f" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "rgba(231,6,84,1)" },
  modalTitle: { color: "#fff", fontWeight: "700", fontSize: 18 },
  counter: { color: "#fff", marginLeft: 6 },
  headerActions: { flexDirection: "row", alignItems: "center" },
  shareBtn: { marginRight: 10, backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5 },
  shareText: { fontWeight: "600" },
  closeBtn: { color: "#fff", fontWeight: "700" },
  modalBody: { flex: 1 },
  betslipContainer: { padding: 10 },
  bonusBox: { padding: 8, backgroundColor: "#fbd702", marginBottom: 10 },
  placeholderContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "rgba(255,255,255,0.1)" },
  placeholderHeader: { marginBottom: 20 },
  placeholderTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center" },
  placeholderContent: { alignItems: "center", justifyContent: "center" },
  placeholderText: { fontSize: 18, color: "#fff", marginTop: 20, textAlign: "center" },
  placeholderSubtext: { fontSize: 14, color: "#ccc", marginTop: 10, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, backgroundColor: "#111", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10 },
  footerItem: { flex: 1, alignItems: "center" },
  footerText: { color: "#fff" },
  input: { backgroundColor: "#fff", padding: 5, width: 70, textAlign: "center" },
  betButton: { backgroundColor: "#e70654", padding: 10, borderRadius: 5 },
  betButtonText: { color: "#fff", fontWeight: "700" },
});