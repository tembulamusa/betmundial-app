import { useEffect } from "react";

import { getItem } from "./utils/local-storage";
import { betslipStore } from "../stores/betslipStore";

const BetslipHydrator = () => {
    useEffect(() => {
        let mounted = true;

        Promise.all([getItem("betslip"), getItem("jackpotbetslip")]).then(
            ([betslip, jackpotbetslip]) => {
                if (!mounted) return;
                betslipStore.hydrate(betslip || {}, jackpotbetslip || {});
            }
        );

        return () => {
            mounted = false;
        };
    }, []);

    return null;
};

export default BetslipHydrator;
