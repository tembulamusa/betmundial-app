import { setItem } from "../utils/local-storage";
import { commitBetslipUpdate } from "../../stores/betslipStore";

export async function rebetSlip(state: any, dispatch: (action: any) => void) {
    if (state?.jackpotrebetslip) {
        const slip = state.jackpotrebetslip;
        commitBetslipUpdate(dispatch, "jackpotbetslip", slip);
        await setItem("jackpotbetslip", slip);
        dispatch({ type: "DEL", key: "jackpotrebetslip" });
        return;
    }

    if (state?.rebetslip) {
        const slip = state.rebetslip;
        commitBetslipUpdate(dispatch, "betslip", slip);
        await setItem("betslip", slip);
        dispatch({ type: "DEL", key: "rebetslip" });
    }
}
