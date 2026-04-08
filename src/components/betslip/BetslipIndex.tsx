import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";

import { Context } from "../../context/store";
import BetSlip from "./Betslip";
import { getItem } from "../utils/local-storage";

interface Props {
  betslipValidationData?: any;
  jackpotData?: any;
  footerOffset?: number;
}

const BetslipIndex: React.FC<Props> = ({
  betslipValidationData,
  jackpotData,
}) => {
  const [state, dispatch] = useContext(Context);

  const [showBetslip, setShowBetslip] = useState(false);

  /* ================= LOAD CONTROL ================= */
  useEffect(() => {
    if (state?.showmobileslip) {
      const timer = setTimeout(() => setShowBetslip(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowBetslip(false);
    }
  }, [state?.showmobileslip]);

  /* ================= SHARE ================= */
  const showShareModalDialog = useCallback(() => {
    const loggedInUser = getItem("user") ?? null;

    if (!loggedInUser) {
      dispatch({ type: "SET", key: "showloginmodal", payload: true });
    } else {
      dispatch({ type: "SET", key: "showsharemodal", payload: true });
    }
  }, [dispatch]);

  /* ================= MEMOS ================= */
  const slipCount = useMemo(
    () => Object.keys(state?.betslip || {}).length,
    [state?.betslip]
  );

  /* ================= HEADER ================= */
  const Header = useCallback(() => (
    <View style={styles.modalHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.modalTitle}>
          {state?.isjackpot ? "Jackpot" : "Betslip"}
        </Text>

        {!state?.isjackpot && (
          <Text style={styles.counter}>({slipCount})</Text>
        )}
      </View>

      <View style={styles.headerActions}>
        {slipCount > 0 && (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={showShareModalDialog}
          >
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() =>
            dispatch({ type: "SET", key: "showmobileslip", payload: false })
          }
        >
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [state?.isjackpot, slipCount, showShareModalDialog, dispatch]);

  /* ================= PLACEHOLDER ================= */
  const Placeholder = () => (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        {state?.isjackpot ? "Jackpot" : "Betslip"}
      </Text>

      <ActivityIndicator size="large" color="#a71f66" />

      <Text style={styles.placeholderText}>Loading betslip...</Text>
    </View>
  );

  /* ================= LIST HEADER ================= */
  const ListHeader = useCallback(() => {
    if (!showBetslip) return <Placeholder />;

    return (
      <>
        {!state?.isjackpot && (
          <View style={styles.bonusBox}>
            <Text>Select 3 or more games to win big bonus</Text>
          </View>
        )}
      </>
    );
  }, [showBetslip, state?.isjackpot, slipCount]);

  /* ================= RENDER ================= */
  return (
    <View style={{ flex: 1 }}>
      <Modal visible={!!state?.showmobileslip} animationType="slide">
        <View style={styles.modalContainer}>

          <Header />

          {/* ✅ ROOT FLATLIST (NO SCROLLVIEW) */}
          <FlatList
            data={showBetslip ? [1] : []} // dummy data
            keyExtractor={() => "betslip-root"}
            ListHeaderComponent={ListHeader}
            renderItem={() =>
              showBetslip ? (
                <BetSlip
                  jackpot={state?.isjackpot}
                  betslipValidationData={betslipValidationData}
                  jackpotData={jackpotData}
                />
              ) : null
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
          />
        </View>
      </Modal>
    </View>
  );
};

export default React.memo(BetslipIndex);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#0f0f1f",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(231,6,84,1)",
  },

  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  counter: {
    color: "#fff",
    marginLeft: 6,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  shareBtn: {
    marginRight: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },

  shareText: {
    fontWeight: "600",
  },

  closeBtn: {
    color: "#fff",
    fontWeight: "700",
  },

  listContent: {
    padding: 10,
    paddingBottom: 40,
  },

  bonusBox: {
    padding: 8,
    backgroundColor: "#fbd702",
    marginBottom: 10,
  },

  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  placeholderTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },

  placeholderText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
});