import React, { useContext, useEffect, useState, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { Context } from "../../context/store";
import BetSlip from "./Betslip";
import { getItem } from "../utils/local-storage";
import { makeRequest } from "../utils/makeRequest";
import { buildBonusAdvice } from "./betslipCalculations";

interface Props {
  betslipValidationData?: any;
  jackpotData?: any;
  footerOffset?: number;
}

type BetslipHeaderProps = {
  isJackpot?: boolean;
  slipCount: number;
  onShare: () => void;
  onClose: () => void;
};

const BetslipModalHeader = memo(function BetslipModalHeader({
  isJackpot,
  slipCount,
  onShare,
  onClose,
}: BetslipHeaderProps) {
  return (
    <View style={styles.modalHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.modalTitle}>
          {isJackpot ? "Jackpot" : "Betslip"}
        </Text>

        {!isJackpot ? (
          <Text style={styles.counter}>({slipCount})</Text>
        ) : null}
      </View>

      <View style={styles.headerActions}>
        {slipCount > 0 ? (
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>✕ Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const BetslipPlaceholder = memo(function BetslipPlaceholder({
  isJackpot,
}: {
  isJackpot?: boolean;
}) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>
        {isJackpot ? "Jackpot" : "Betslip"}
      </Text>

      <ActivityIndicator size="large" color="#a71f66" />

      <Text style={styles.placeholderText}>Loading betslip...</Text>
    </View>
  );
});

const BetslipIndex: React.FC<Props> = ({
  betslipValidationData,
  jackpotData,
}) => {
  const [state, dispatch] = useContext(Context);

  const [showBetslip, setShowBetslip] = useState(false);
  const [dbWinMatrix, setDbWinMatrix] = useState<Record<string, any>>({});

  useEffect(() => {
    if (state?.showmobileslip) {
      const timer = setTimeout(() => setShowBetslip(true), 150);
      return () => clearTimeout(timer);
    } else {
      setShowBetslip(false);
    }
  }, [state?.showmobileslip]);

  useEffect(() => {
    makeRequest({
      url: "/sports/config/sgr",
      method: "GET",
      apiVersion: 2,
    }).then((res) => {
      if (res.status === 200) {
        const body: any = res.data?.data ?? res.data;
        if (body) {
          setDbWinMatrix(body);
          dispatch({ type: "SET", key: "bonusCentages", payload: body });
        }
      }
    });
  }, [dispatch]);

  const showShareModalDialog = useCallback(() => {
    const loggedInUser = getItem("user") ?? null;

    if (!loggedInUser) {
      dispatch({ type: "SET", key: "showloginmodal", payload: true });
    } else {
      dispatch({ type: "SET", key: "showsharemodal", payload: true });
    }
  }, [dispatch]);

  const slipCount = useMemo(
    () => Object.keys(state?.betslip || {}).length,
    [state?.betslip]
  );

  const bonusAdvice = useMemo(() => {
    const slips = Object.values(state?.betslip || {});
    return buildBonusAdvice(slips, dbWinMatrix);
  }, [state?.betslip, dbWinMatrix]);

  const closeBetslip = useCallback(() => {
    dispatch({ type: "SET", key: "showmobileslip", payload: false });
  }, [dispatch]);

  return (
    <>
      <Modal visible={!!state?.showmobileslip} animationType="slide">
        <View style={styles.modalContainer}>
          <BetslipModalHeader
            isJackpot={state?.isjackpot}
            slipCount={slipCount}
            onShare={showShareModalDialog}
            onClose={closeBetslip}
          />

          <ScrollView
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!showBetslip ? (
              <BetslipPlaceholder isJackpot={state?.isjackpot} />
            ) : (
              <>
                {!state?.isjackpot && slipCount > 0 ? (
                  <View style={styles.bonusBox}>
                    <Text style={styles.bonusBoxText}>{bonusAdvice}</Text>
                  </View>
                ) : null}

                <BetSlip
                  jackpot={state?.isjackpot}
                  betslipValidationData={betslipValidationData}
                  jackpotData={jackpotData}
                  dbWinMatrix={dbWinMatrix}
                />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default React.memo(BetslipIndex);

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
    borderRadius: 6,
  },
  bonusBoxText: {
    color: "#101b25",
    fontSize: 13,
    fontWeight: "600",
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
