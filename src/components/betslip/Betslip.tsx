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
        const b = state?.isjackpot ? getJackpotBetslip() : getBetslip();
        setBetslipsData(b || {});
    }, [state?.betslip, state?.jackpotbetslip, state?.isjackpot]);

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



    // FILTER NULL ITEMS
    const data = Object.values(betslipsData || {}).filter(Boolean);

    return (
        <View style={styles.container}>

            <Text style={styles.header}>
                {state?.isjackpot ? 'Jackpot' : 'Betslip'} ({data.length})
            </Text>

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

                                    <Text style={styles.pick}>
                                        {item.odd_type} — {item.bet_pick} • {Number(item.odd_value).toFixed(2)}
                                    </Text>
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
        padding: 12,
        backgroundColor: '#07070a',
        borderRadius: 8
    },

    header: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 8
    },

    empty: {
        color: '#999',
        textAlign: 'center',
        padding: 12
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#111'
    },

    teams: {
        color: '#fff',
        fontWeight: '600'
    },

    pick: {
        color: '#ccc',
        marginTop: 4
    },

    removeBtn: {
        padding: 8,
        backgroundColor: '#222',
        borderRadius: 6
    },

    removeText: {
        color: '#fff'
    }
});