import React, {
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
    memo,
} from 'react';

import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from 'react-native';

import BetslipSubmitForm from './BetslipSubmitForm';
import BetslipAlert from './BetslipAlert';
import { Context } from '../../context/store';
import { rebetSlip } from './betslipActions';

import {
    applyRemoveFromSlip,
    applyRemoveFromJackpotSlip,
    getBetslip,
    getJackpotBetslip,
    persistBetslipSnapshot,
    persistJackpotBetslipSnapshot,
} from '../utils/betslip';
import { betslipStore, commitBetslipUpdate } from '../../stores/betslipStore';

const Betslip: React.FC<{
    jackpot?: boolean;
    jackpotData?: any;
    dbWinMatrix?: Record<string, any>;
}> = ({
    jackpot,
    jackpotData,
    dbWinMatrix,
}) => {

    const [state, dispatch] = useContext(Context);

    const betslipKey = jackpot ? 'jackpotbetslip' : 'betslip';
    const betslipsData = state?.[betslipKey] || {};

    const [isLoading, setIsLoading] = useState(false);

    const mountedRef = useRef(true);
    const loadedRef = useRef(false);

    useEffect(() => {
        if (loadedRef.current) return;

        const loadSlip = async () => {
            setIsLoading(true);

            const slip = jackpot
                ? await getJackpotBetslip()
                : await getBetslip();

            if (!mountedRef.current) return;

            const cleanSlip = slip || {};

            if (Object.keys(cleanSlip).length !== Object.keys(betslipsData).length) {
                betslipStore.set(betslipKey, cleanSlip);
                dispatch({
                    type: 'SET',
                    key: betslipKey,
                    payload: cleanSlip,
                });
            }

            loadedRef.current = true;
            setIsLoading(false);
        };

        loadSlip();

        return () => {
            mountedRef.current = false;
        };

    }, [jackpot, betslipKey]);

    const handleRemove = useCallback((item: any) => {
        if (!item) return;

        const currentSlip = state?.[betslipKey] || {};
        const nextSlip = jackpot
            ? applyRemoveFromJackpotSlip(currentSlip, item.match_id)
            : applyRemoveFromSlip(currentSlip, item.match_id);

        commitBetslipUpdate(dispatch, betslipKey, nextSlip);

        if (jackpot) {
            persistJackpotBetslipSnapshot(nextSlip);
        } else {
            persistBetslipSnapshot(nextSlip);
        }
    }, [jackpot, betslipKey, dispatch, state]);

    const dismissPlaceBetMessage = useCallback(() => {
        dispatch({ type: "DEL", key: "placebetmessage" });
    }, [dispatch]);

    const handleRebet = useCallback(async () => {
        dispatch({ type: "DEL", key: "placebetmessage" });
        await rebetSlip(state, dispatch);
    }, [dispatch, state]);

    const data = useMemo(
        () => Object.values(betslipsData || {}).filter(Boolean),
        [betslipsData]
    );

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (!item) return null;

        return (
            <View style={styles.item}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.teams}>
                        {item.home_team} VS {item.away_team}
                    </Text>

                    <Text style={styles.meta}>
                        {item?.bet_type === 1 ? 'Live' : 'Pre-match'}
                    </Text>

                    <View style={styles.pickRow}>
                        <Text style={styles.pick}>
                            Pick — {item.bet_pick}
                        </Text>

                        <Text style={styles.oddValue}>
                            {Number(item.odd_value).toFixed(2)}
                        </Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => handleRemove(item)}
                    style={({ pressed }) => [
                        styles.removeBtn,
                        pressed && styles.removeBtnPressed
                    ]}
                >
                    <Text style={styles.removeText}>✕</Text>
                </Pressable>
            </View>
        );
    }, [handleRemove]);

    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#a71f66" />
                    <Text style={styles.loadingText}>Loading betslip...</Text>
                </View>
            ) : data.length === 0 ? (
                <Text style={styles.empty}>
                    {state?.placebetmessage?.status != null
                        ? "You have not selected any bet"
                        : "No bets found"}
                </Text>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => `betslip-${item?.match_id}`}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    initialNumToRender={10}
                />
            )}

            <BetslipAlert
                message={state?.placebetmessage}
                onDismiss={dismissPlaceBetMessage}
                onRebet={handleRebet}
            />

            <BetslipSubmitForm
                jackpot={jackpot}
                jackpotData={jackpotData}
                dbWinMatrix={dbWinMatrix}
            />
        </View>
    );
};

export default memo(Betslip);

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
    },
    empty: {
        color: '#999',
        textAlign: 'center',
        padding: 12
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    teams: {
        color: '#fff',
        fontWeight: '600'
    },
    meta: {
        paddingVertical: 4,
        color: '#aaa',
        fontSize: 12
    },
    pickRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4
    },
    pick: {
        color: '#ccc',
        fontSize: 14
    },
    oddValue: {
        color: '#ffcc00',
        fontWeight: '700',
        fontSize: 16
    },
    removeBtn: {
        padding: 8,
        borderRadius: 6,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    removeBtnPressed: {
        opacity: 0.4,
        transform: [{ scale: 0.9 }],
        backgroundColor: 'rgba(255,0,0,0.1)'
    },
    removeText: {
        color: '#de0808',
        fontWeight: '700',
        fontSize: 16
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20
    },
    loadingText: {
        color: '#ccc',
        marginTop: 8,
        fontSize: 14
    }
});
