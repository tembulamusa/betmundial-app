import { Alert } from 'react-native';
import {
    getItem,
    setItem,
    removeItem
} from './local-storage';

type Slip = {
    match_id: string;
    bet_type?: number;
    [key: string]: any;
};

export const addToSlip = async (slip: Slip) => {

    let current_slip = await getItem('betslip');

    if (!current_slip) {
        current_slip = {};
    }

    current_slip[slip.match_id] = slip;

    await setItem('betslip', current_slip);
    return current_slip;
};

export const removeFromSlip = async (match_id: string) => {

    let current_slip = await getItem('betslip');

    if (!current_slip) return {};

    delete current_slip[match_id];

    await setItem('betslip', current_slip);

    return current_slip;
};

export const clearSlip = async () => {
    await removeItem('betslip');
};

export const getBetslip = async () => {
    return await getItem('betslip');
};

export const getJackpotBetslip = async () => {
    return await getItem('jackpotbetslip');
};

export const addToJackpotSlip = async (slip: Slip) => {
    let current_slip = await getItem('jackpotbetslip');

    if (current_slip) {
        current_slip[slip.match_id] = slip;
    } else {
        current_slip = { [slip.match_id]: slip };
    }

    await setItem('jackpotbetslip', current_slip, 1 * 60 * 60 * 1000);

    return current_slip;
};

export const removeFromJackpotSlip = async (match_id: string) => {
    let current_slip = await getItem('jackpotbetslip');

    if (current_slip) {
        delete current_slip[match_id];
        await setItem('jackpotbetslip', current_slip, 1 * 60 * 60 * 1000);
    }

    return current_slip;
};

export const clearJackpotSlip = async () => {
    await removeItem('jackpotbetslip');
};

export const formatNumber = (number: number | undefined) => {
    return number == undefined || number == 0
        ? '0'
        : number
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            .replace(".00", '');
};