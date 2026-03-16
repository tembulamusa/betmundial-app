import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import BetslipSubmitForm from './BetslipSubmitForm';
import { Context } from '../../context/store';
import { removeFromSlip, removeFromJackpotSlip, getBetslip, getJackpotBetslip } from '../utils/betslip';

const Betslip: React.FC<{ jackpot?: boolean; jackpotData?: any }> = ({ jackpot, jackpotData }) => {

    const [state, dispatch] = useContext(Context);
    const [betslipsData, setBetslipsData] = useState<any>({});

    const betslipKey = state?.isjackpot ? 'jackpotbetslip' : 'betslip';

    useEffect(() => {
        const loadSlip = async () => {
            const b = state?.isjackpot
                ? await getJackpotBetslip()
                : await getBetslip();

            const slip = b || {};

            setBetslipsData(slip);

            // Update state so the component has the latest slip on load
            dispatch({
                type: "SET",
                key: betslipKey,
                payload: slip
            });
        };

        loadSlip();
    }, [state?.isjackpot]);

    const handleRemove = (item: any) => {
        if (!item) return;

        const betslip =
            betslipKey === 'betslip'
                ? removeFromSlip(item.match_id)
                : removeFromJackpotSlip(item.match_id);

        dispatch({
            type: 'SET',
            key: betslipKey,
            payload: betslip
        });
    };

    // Filter out any null/undefined items
    const data = Object.values(betslipsData || {}).filter(Boolean);

    return (
        <View style={styles.container}>

            {data.length === 0 ? (
                <Text style={styles.empty}>No selections yet</Text>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => String(item?.match_id)}
                    renderItem={({ item }) => {
                        if (!item) return null;

                        return (
                            <View style={styles.item}>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.teams}>
                                        {item.home_team} VS {item.away_team}
                                    </Text>
                                    <Text style={{ paddingVertical: 4, color: '#aaa', fontSize: 12 }}>
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

                                <TouchableOpacity
                                    onPress={() => handleRemove(item)}
                                    style={styles.removeBtn}
                                >
                                    <Text style={styles.removeText}>X</Text>
                                </TouchableOpacity>

                            </View>
                        );
                    }}
                />
            )}

            <BetslipSubmitForm jackpot={jackpot} jackpotData={jackpotData} />

        </View>
    );
};

export default Betslip;

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        // padding: 12,
        // backgroundColor: '#07070a'
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
        // backgroundColor: '#222',
        borderRadius: 6,
        fontWeight: '700',
        marginLeft: 10
    },

    removeText: {
        color: '#de0808',
        fontWeight: '700'
    }
});