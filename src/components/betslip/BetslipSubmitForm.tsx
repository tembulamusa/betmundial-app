import React, {
    useState,
    useEffect,
    useContext,
    useMemo,
    useCallback,
    useRef,
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Pressable,
    ActivityIndicator,
} from "react-native";

import { Context } from "../../context/store";

import {
    clearSlip,
    clearJackpotSlip,
    formatNumber,
} from "../utils/betslip";

import { getItem, removeItem } from "../utils/local-storage";
import { makeRequest } from "../utils/makeRequest";
import { formatToFloat } from "../utils/formatters";
import { theme } from "../../theme";
import { calculateWinnings, Float } from "./betslipCalculations";
import { commitBetslipUpdate } from "../../stores/betslipStore";
import {
    buildPlaceBetSuccessMessage,
    buildPlaceBetSuccessTitle,
    extractPlaceBetError,
    getDepositTopUpAmount,
    isPlaceBetSuccess,
    PlaceBetMessage,
} from "./placebetMessages";

interface Props {
    jackpot?: boolean;
    jackpotData?: any;
    dbWinMatrix?: Record<string, any>;
}

const BetslipSubmitForm: React.FC<Props> = ({
    jackpot,
    jackpotData,
    dbWinMatrix = {},
}) => {
    const [state, dispatch] = useContext(Context);

    const betslipkey = jackpot ? "jackpotbetslip" : "betslip";

    const [stakeInput, setStakeInput] = useState(
        String(state?.mobilefooteramount ?? jackpotData?.bet_amount ?? 100)
    );
    const [useBonus, setUseBonus] = useState(false);
    const [showBonusTerms, setShowBonusTerms] = useState(false);
    const [bonusSettings, setBonusSettings] = useState({ percentage: 100 });
    const [ipInfo, setIpInfo] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showPlaceBetMessage = useCallback(
        (nextMessage: PlaceBetMessage | null) => {
            if (!nextMessage || nextMessage.status == null) {
                dispatch({ type: "DEL", key: "placebetmessage" });
                return;
            }

            dispatch({
                type: "SET",
                key: "placebetmessage",
                payload: nextMessage,
            });
        },
        [dispatch]
    );

    const openLoginModal = useCallback(() => {
        dispatch({ type: "DEL", key: "showloginmodal" });
        dispatch({ type: "SET", key: "showloginmodal", payload: true });
    }, [dispatch]);

    const slips = useMemo(
        () => Object.values(state?.[betslipkey] || {}),
        [state?.[betslipkey], betslipkey]
    );

    const stake = useMemo(() => {
        const parsed = parseInt(stakeInput, 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [stakeInput]);

    const openDepositPrompt = useCallback(
        (errorMessage: string) => {
            const balance = parseFloat(String(state?.user?.balance ?? 0)) || 0;
            const payableAmt = getDepositTopUpAmount(stake, balance);

            dispatch({ type: "SET", key: "showmobileslip", payload: false });
            dispatch({
                type: "SET",
                key: "promptdepositrequest",
                payload: {
                    show: true,
                    payableAmt,
                    message: { status: 400, message: errorMessage },
                },
            });
        },
        [dispatch, stake, state?.user?.balance]
    );

    const bonusBalance = useMemo(() => {
        const raw = state?.user?.bonus ?? state?.user?.bonus_balance ?? 0;
        return parseFloat(formatToFloat(raw)) || 0;
    }, [state?.user]);

    const bonusUsePercentage = bonusSettings?.percentage ?? 100;
    const bonusStakePortion = Math.min(
        Float(stake * (bonusUsePercentage / 100), 2),
        bonusBalance
    );
    const balanceStakePortion = Math.max(Float(stake - bonusStakePortion, 2), 0);

    const calculations = useMemo(() => {
        return calculateWinnings({
            slips,
            stake,
            jackpot,
            jackpotData,
            dbWinMatrix,
        });
    }, [slips, stake, jackpot, jackpotData, dbWinMatrix]);

    useEffect(() => {
        if (bonusBalance > 0) {
            setUseBonus(true);
        }
    }, [bonusBalance]);

    useEffect(() => {
        if (jackpot && jackpotData?.bet_amount) {
            setStakeInput(String(jackpotData.bet_amount));
            return;
        }

        if (state?.mobilefooteramount !== undefined && state?.mobilefooteramount !== null) {
            setStakeInput(String(state.mobilefooteramount));
        }
    }, [jackpot, jackpotData?.bet_amount, state?.mobilefooteramount]);

    useEffect(() => {
        makeRequest({
            url: "bonus/settings",
            method: "GET",
            apiVersion: 2,
        }).then((res) => {
            if (res.status === 200 && res.data) {
                const data: any = res.data?.data ?? res.data;
                setBonusSettings({
                    percentage: parseFloat(
                        data?.percentage ?? data?.bonus_use_percentage ?? 100
                    ),
                });
            }
        });
    }, []);

    useEffect(() => {
        fetch("https://api64.ipify.org?format=json")
            .then((res) => res.json())
            .then((data) => setIpInfo(data?.ip || null))
            .catch(() => setIpInfo(null));
    }, []);

    const slipCountRef = useRef(Object.keys(state?.[betslipkey] || {}).length);

    useEffect(() => {
        const slipCount = Object.keys(state?.[betslipkey] || {}).length;
        if (slipCount > slipCountRef.current && state?.placebetmessage) {
            dispatch({ type: "DEL", key: "placebetmessage" });
        }
        slipCountRef.current = slipCount;
    }, [state?.[betslipkey], betslipkey, dispatch, state?.placebetmessage]);

    const onStakeChange = useCallback(
        (text: string) => {
            if (!/^\d*$/.test(text)) return;
            setStakeInput(text);
            const parsed = text === "" ? "" : parseInt(text, 10);
            dispatch({
                type: "SET",
                key: "mobilefooteramount",
                payload: parsed,
            });
        },
        [dispatch]
    );

    const handleRemoveAll = useCallback(() => {
        if (jackpot) {
            void clearJackpotSlip();
        } else {
            void clearSlip();
        }

        commitBetslipUpdate(dispatch, betslipkey, {});
    }, [betslipkey, dispatch, jackpot]);

    const handlePlaceBet = async () => {
        if (isSubmitting) return;

        if (!slips.length) {
            showPlaceBetMessage({
                status: 400,
                message: "No bet selected",
            });
            return;
        }

        if (!jackpot && stake < 1) {
            showPlaceBetMessage({
                status: 400,
                message: "Enter valid bet amount",
            });
            return;
        }

        if (!jackpot && stake > 20000) {
            showPlaceBetMessage({
                status: 400,
                message: "Maximum stake is KSh 20,000",
            });
            return;
        }

        const user = state?.user || (await getItem("user"));

        if (!user?.token && !user?.access_token) {
            openLoginModal();
            return;
        }

        setIsSubmitting(true);
        showPlaceBetMessage(null);

        try {
            let slipHasOddsChange = false;
            let slipHasUnbettableEvents = false;

            const cleanedSlip = slips.map((slip: any) => {
                if (slip.disable === true) slipHasUnbettableEvents = true;
                if (slip.prev_odds && slip.prev_odds !== slip.odd_value) {
                    slipHasOddsChange = true;
                }

                const {
                    start_time,
                    disable,
                    comment,
                    prev_odds,
                    changeOrigin,
                    event_status,
                    ...rest
                } = slip;

                return rest;
            });

            if (slipHasUnbettableEvents || slipHasOddsChange) {
                let msg = "";

                if (slipHasUnbettableEvents) {
                    msg += "Slip has events that have been disabled or suspended. Please remove to proceed.";
                }

                if (slipHasOddsChange) {
                    msg += "Slip has events with changed odds. Please review your selections.";
                }

                showPlaceBetMessage({
                    status: 400,
                    message: msg.trim(),
                });
                return;
            }

            const hasLivePick = cleanedSlip.some(
                (slip: any) => slip?.live === 1 || slip?.bet_type === 1
            );

            const payload = {
                bet_string: "mobile",
                app_name: "mobile",
                possible_win: calculations.netWin,
                stake_amount: jackpot ? jackpotData?.bet_amount : stake,
                amount: jackpot ? jackpotData?.bet_amount : stake,
                bet_total_odds: Float(calculations.totalOdds, 2),
                ip_address: ipInfo,
                channel_id: "mobile",
                slip: cleanedSlip,
                profile_id: user?.profile_id,
                account: 1,
                msisdn: user?.msisdn,
                accept_all_odds_change: 0,
                bet_type: hasLivePick ? "1" : jackpot ? "9" : "3",
                ...(jackpot ? { jackpot_id: jackpotData?.jackpot_event_id } : {}),
            };

            const endpoint = jackpot
                ? "/user/jackpot/place-bet"
                : "/user/place-bet";

            const res = await makeRequest({
                url: endpoint,
                method: "POST",
                data: payload,
                apiVersion: 2,
            });

            const body: any = res.data;
            const bodyStatus = body?.status;
            const httpOk =
                res.status == 200 ||
                res.status == 201 ||
                res.status == 204;

            if (res.status == 402) {
                openDepositPrompt(
                    extractPlaceBetError(
                        res,
                        "Insufficient balance. Please deposit to continue."
                    )
                );
                return;
            }

            if (httpOk || jackpot) {
                if (isPlaceBetSuccess(res, jackpot)) {
                    dispatch({
                        type: "SET",
                        key: "toggleuserbalance",
                        payload: state?.toggleuserbalance
                            ? !state?.toggleuserbalance
                            : true,
                    });
                    await removeItem("bonusCentage");

                    dispatch({
                        type: "SET",
                        key: jackpot ? "jackpotrebetslip" : "rebetslip",
                        payload: state?.[betslipkey],
                    });

                    if (jackpot) {
                        await clearJackpotSlip();
                    } else {
                        await clearSlip();
                    }

                    commitBetslipUpdate(dispatch, betslipkey, {});

                    showPlaceBetMessage({
                        status: res.status == 201 ? 201 : 200,
                        title: buildPlaceBetSuccessTitle(
                            slips.length,
                            hasLivePick,
                            jackpot
                        ),
                        message: buildPlaceBetSuccessMessage(res, jackpot),
                    });
                    return;
                }

                if (bodyStatus == 402 || bodyStatus == 403) {
                    openDepositPrompt(
                        extractPlaceBetError(
                            res,
                            String(body?.result || body?.message || "Insufficient balance")
                        )
                    );
                    return;
                }
            }

            const errMsg = extractPlaceBetError(res);
            showPlaceBetMessage({
                status: bodyStatus || res.status || 400,
                message: String(errMsg),
            });
        } catch (err: any) {
            showPlaceBetMessage({
                status: 500,
                message: err?.message || "Error attempting to place bet",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const showForm =
        slips.length > 0 || state?.placebetmessage?.status != null;

    if (!showForm) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.tableSection}>
                {!jackpot ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>TOTAL ODDS</Text>
                        <Text style={styles.value}>
                            {calculations.totalOdds.toFixed(2)}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <Text style={styles.label}>AMOUNT (KSH)</Text>
                    {jackpot ? (
                        <Text style={styles.value}>{jackpotData?.bet_amount}</Text>
                    ) : (
                        <TextInput
                            style={styles.stakeInput}
                            keyboardType="number-pad"
                            value={stakeInput}
                            onChangeText={onStakeChange}
                            placeholder="100"
                            placeholderTextColor="rgba(255,255,255,0.45)"
                            selectTextOnFocus
                        />
                    )}
                </View>

                {!jackpot && bonusBalance > 0 ? (
                    <View style={styles.bonusRow}>
                        <Pressable
                            style={styles.useBonusRow}
                            onPress={() => setUseBonus((prev) => !prev)}
                        >
                            <View style={[styles.checkbox, useBonus && styles.checkboxChecked]}>
                                {useBonus ? <Text style={styles.checkMark}>✓</Text> : null}
                            </View>
                            <Text style={styles.useBonusText}>
                                Use Bonus (
                                <Text style={styles.goldText}>
                                    KSh {formatNumber(bonusBalance)}
                                </Text>
                                )
                            </Text>
                        </Pressable>

                        <TouchableOpacity onPress={() => setShowBonusTerms(true)}>
                            <Text style={styles.termsLink}>Terms</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {!jackpot ? (
                    <View style={styles.row}>
                        <Text style={styles.label}>Excise Tax (0%)</Text>
                        <Text style={styles.value}>
                            KSH {calculations.exciseTax.toFixed(2)}
                        </Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.placeBetSection}>
                {!jackpot ? (
                    <View style={styles.highlightRow}>
                        <Text style={styles.highlightLabel}>Bonus</Text>
                        <Text style={styles.highlightValue}>
                            KES {formatNumber(calculations.bonus || 0)}
                        </Text>
                    </View>
                ) : null}

                <View style={styles.row}>
                    <Text style={styles.winLabel}>Possible Win</Text>
                    <Text style={styles.winValue}>
                        KSH{" "}
                        {formatNumber(
                            jackpot
                                ? jackpotData?.jackpot_amount
                                : calculations.possibleWin
                        )}
                    </Text>
                </View>

                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={handleRemoveAll}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnText}>REMOVE ALL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.placeBtn,
                            (isSubmitting || slips.length === 0) && styles.placeBtnDisabled,
                        ]}
                        onPress={handlePlaceBet}
                        disabled={isSubmitting || slips.length === 0}
                        activeOpacity={0.85}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>PLACE BET</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={showBonusTerms}
                transparent
                animationType="fade"
                onRequestClose={() => setShowBonusTerms(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => setShowBonusTerms(false)}
                        >
                            <Text style={styles.closeText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Bonus Terms</Text>
                        <Text style={styles.modalText}>
                            Bonus funds are subject to wagering requirements and expiry.
                        </Text>

                        {useBonus ? (
                            <Text style={styles.modalText}>
                                At {bonusUsePercentage}% bonus usage, placing this KSh{" "}
                                {formatNumber(stake)} bet will deduct{" "}
                                <Text style={styles.goldText}>
                                    KSh {formatNumber(bonusStakePortion)}
                                </Text>{" "}
                                from your bonus balance and KSh{" "}
                                {formatNumber(balanceStakePortion)} from your real balance.
                            </Text>
                        ) : (
                            <Text style={styles.modalText}>
                                Tick "Use Bonus" to cover part of this stake from your bonus
                                balance instead of your real balance.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.placeBtn}
                            onPress={() => setShowBonusTerms(false)}
                        >
                            <Text style={styles.btnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default React.memo(BetslipSubmitForm);

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    tableSection: {
        paddingHorizontal: 12,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.12)",
    },
    placeBetSection: {
        backgroundColor: "rgba(255,255,255,0.05)",
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        gap: 12,
    },
    label: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        textTransform: "uppercase",
        flex: 1,
    },
    value: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    stakeInput: {
        minWidth: 100,
        height: 30,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
        borderRadius: 6,
        backgroundColor: "rgba(0,0,0,0.25)",
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        paddingHorizontal: 8,
        paddingVertical: 0,
        textAlign: "right",
    },
    bonusRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    useBonusRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.6)",
        borderRadius: 3,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    checkboxChecked: {
        backgroundColor: "#e70654",
        borderColor: "#e70654",
    },
    checkMark: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 14,
    },
    useBonusText: {
        color: "#fff",
        fontSize: 13,
        flexShrink: 1,
    },
    goldText: {
        color: "rgba(255, 215, 0, 1)",
        fontWeight: "700",
    },
    termsLink: {
        color: theme.accent,
        fontWeight: "600",
        fontSize: 13,
        marginLeft: 10,
        textDecorationLine: "underline",
        textDecorationStyle: "dotted",
        textDecorationColor: theme.accent,
    },
    highlightRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        marginBottom: 8,
    },
    highlightLabel: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    highlightValue: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    winLabel: {
        color: "#fff",
        fontSize: 14,
        textTransform: "capitalize",
    },
    winValue: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 8,
    },
    removeBtn: {
        flex: 1,
        backgroundColor: "#444",
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: "center",
    },
    placeBtn: {
        flex: 1,
        backgroundColor: "#e70654",
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
    },
    placeBtnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        padding: 20,
    },
    modalCard: {
        backgroundColor: "#0c0c24",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    modalClose: {
        position: "absolute",
        right: 12,
        top: 8,
        zIndex: 2,
    },
    closeText: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "700",
        lineHeight: 28,
    },
    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    modalText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
});
