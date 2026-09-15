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
import BongeBonusCard from "./BongeBonusCard";
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
  onClose: () => void;
};

/** Mobile modal header — mirrors web `rgba(231,6,84)` betslip modal header */
const BetslipModalHeader = memo(function BetslipModalHeader({
  isJackpot,
  slipCount,
  onClose,
}: BetslipHeaderProps) {
  return (
    <View style={styles.modalHeader}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.modalTitle}>
          {isJackpot ? "jackpot" : "Betslip"}
        </Text>
        {isJackpot ? (
          <Text style={styles.counter}> {slipCount}</Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.closeBtn}>✕</Text>
      </TouchableOpacity>
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
    }
    setShowBetslip(false);
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

  const slipCount = useMemo(
    () => Object.keys(state?.betslip || {}).length,
    [state?.betslip]
  );

  const jackpotSlipCount = useMemo(
    () => Object.keys(state?.jackpotbetslip || {}).length,
    [state?.jackpotbetslip]
  );

  const bonusAdvice = useMemo(() => {
    const slips = Object.values(state?.betslip || {});
    return buildBonusAdvice(slips, dbWinMatrix);
  }, [state?.betslip, dbWinMatrix]);

  const closeBetslip = useCallback(() => {
    dispatch({ type: "SET", key: "showmobileslip", payload: false });
  }, [dispatch]);

  const headerCount = state?.isjackpot ? jackpotSlipCount : slipCount;

  return (
    <Modal visible={!!state?.showmobileslip} animationType="slide">
      <View style={styles.modalContainer}>
        <BetslipModalHeader
          isJackpot={state?.isjackpot}
          slipCount={headerCount}
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
              {!state?.isjackpot ? (
                <BongeBonusCard advice={bonusAdvice} slipCount={slipCount} />
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
  );
};

export default React.memo(BetslipIndex);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 12, 36, 1)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: "rgba(231,6,84,1)",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textTransform: "uppercase",
  },
  counter: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  closeBtn: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 40,
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
