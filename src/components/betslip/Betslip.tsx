import React, { useContext, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator
} from 'react-native';

import BetslipSubmitForm from './BetslipSubmitForm';
import { Context } from '../../context/store';

import {
    removeFromSlip,
    removeFromJackpotSlip,
    getBetslip,
    getJackpotBetslip
} from '../utils/betslip';

const Betslip: React.FC<{ jackpot?: boolean; jackpotData?: any }> = ({
    jackpot,
    jackpotData
}) => {

    const [state, dispatch] = useContext(Context);
    const [betslipsData, setBetslipsData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);

    const betslipKey = jackpot ? 'jackpotbetslip' : 'betslip';

    const loadSlip = async () => {
        setIsLoading(true);

        const slip = jackpot
            ? await getJackpotBetslip()
            : await getBetslip();

        const cleanSlip = slip || {};

        setBetslipsData(cleanSlip);

        dispatch({
            type: "SET",
            key: betslipKey,
            payload: cleanSlip
        });

        setIsLoading(false);
    };

    useEffect(() => {
        loadSlip();
    }, [jackpot]);

    const handleRemove = async (item: any) => {
        if (!item) return;

        if (jackpot) {
            await removeFromJackpotSlip(item.match_id);
        } else {
            await removeFromSlip(item.match_id);
        }

        const updatedSlip = jackpot
            ? await getJackpotBetslip()
            : await getBetslip();

        const cleanSlip = updatedSlip || {};

        setBetslipsData(cleanSlip);

        dispatch({
            type: 'SET',
            key: betslipKey,
            payload: cleanSlip
        });
    };

    const data = Object.values(betslipsData || {}).filter(Boolean);

    return (
        <View style={styles.container}>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#a71f66" />
                    <Text style={styles.loadingText}>Loading betslip...</Text>
                </View>
            ) : data.length === 0 ? (
                <Text style={styles.empty}>No bets found</Text>
            ) : (
                <FlatList
                    data={data}
                    extraData={betslipsData}
                    keyExtractor={(item) => String(item?.match_id)}
                    renderItem={({ item }) => {
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

                                {/* ✅ Pressable with feedback */}
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
                    }}
                />
            )}

            <BetslipSubmitForm
                jackpot={jackpot}
                jackpotData={jackpotData}
            />

        </View>
    );
};

export default Betslip;

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

    // 🔥 pressed state (blur/feedback effect)
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