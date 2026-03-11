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

export const addToSlip = (slip: Slip) => {
    let current_slip = getItem('betslip');
    let liveCount = getItem("liveCount");

    if (current_slip) {
        current_slip[slip.match_id] = slip;
    } else {
        current_slip = { [slip.match_id]: slip };

        if (slip?.bet_type == 1) {
            let liveCount = getItem("liveCount");

            if (liveCount) {
                liveCount += 1;
            } else {
                liveCount = 1;
            }

            setItem("liveCount", liveCount);
        }
    }

    setItem('betslip', current_slip, 1 * 60 * 60 * 1000);
    return current_slip;
};

export const removeFromSlip = (match_id: string) => {
    let current_slip = getItem('betslip');

    if (current_slip) {
        let liveCount = getItem("liveCount");

        if (current_slip[match_id]?.bet_type == 1) {
            if (liveCount > 0) {
                liveCount--;
                setItem("liveCount", liveCount);
            }
        }

        delete current_slip[match_id];
        setItem('betslip', current_slip, 1 * 60 * 60 * 1000);
    }

    return current_slip;
};

export const clearSlip = () => {
    removeItem('betslip');
};

export const getBetslip = () => {
    return getItem('betslip');
};

export const getJackpotBetslip = () => {
    return getItem('jackpotbetslip');
};

export const addToJackpotSlip = (slip: Slip) => {
    let current_slip = getItem('jackpotbetslip');

    if (current_slip) {
        current_slip[slip.match_id] = slip;
    } else {
        current_slip = { [slip.match_id]: slip };
    }

    setItem('jackpotbetslip', current_slip, 1 * 60 * 60 * 1000);

    return current_slip;
};

export const removeFromJackpotSlip = (match_id: string) => {
    let current_slip = getItem('jackpotbetslip');

    if (current_slip) {
        delete current_slip[match_id];
        setItem('jackpotbetslip', current_slip, 1 * 60 * 60 * 1000);
    }

    return current_slip;
};

export const clearJackpotSlip = () => {
    removeItem('jackpotbetslip');
};

export const formatNumber = (number: number | undefined) => {
    return number == undefined || number == 0
        ? '0'
        : number
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            .replace(".00", '');
};