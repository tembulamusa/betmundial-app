export const Float = (equation: number, precision = 4) =>
    Math.ceil(equation * 10 ** precision) / 10 ** precision;

export type WinningsResult = {
    totalOdds: number;
    netWin: number;
    bonus: number;
    possibleWin: number;
    exciseTax: number;
    qualifyingGames: number;
    bonusPercent: number;
};

export function calculateWinnings({
    slips,
    stake,
    jackpot,
    jackpotData,
    dbWinMatrix,
}: {
    slips: any[];
    stake: number;
    jackpot?: boolean;
    jackpotData?: any;
    dbWinMatrix?: Record<string, any>;
}): WinningsResult {
    const safeStake = Number.isFinite(stake) && stake > 0 ? stake : 0;

    const totalOdds = slips.reduce(
        (prev, item) => prev * (Number(item?.odd_value) || 1),
        1
    );

    const minOdds = dbWinMatrix?.sgr_bonus_min_odds || 1.3;
    const maxGames = dbWinMatrix?.sgr_bonus_max_games || 30;

    let qualifyingGames = slips.filter(
        (slip) => Number(slip?.odd_value) > minOdds
    ).length;

    if (qualifyingGames > maxGames) {
        qualifyingGames = maxGames;
    }

    const bonusKey = `sgr_bonus_percent_${qualifyingGames}`;
    const bonusPercent = Number(dbWinMatrix?.[bonusKey] || 0);

    let rawPossibleWin = Float(safeStake * totalOdds);

    if (jackpot) {
        rawPossibleWin = Number(jackpotData?.jackpot_amount) || 0;
    }

    if (rawPossibleWin > 500000 && !jackpot) {
        rawPossibleWin = 500000;
    }

    const exciseTax = 0;
    const netWin = Float(rawPossibleWin, 2);
    const bonus = jackpot
        ? 0
        : Float(rawPossibleWin * (bonusPercent / 100), 2) || 0;

    return {
        totalOdds,
        netWin,
        bonus,
        possibleWin: Float(netWin + bonus, 2),
        exciseTax,
        qualifyingGames,
        bonusPercent,
    };
}

export function buildBonusAdvice(
    slips: any[],
    dbWinMatrix?: Record<string, any>
): string {
    const minOdds = dbWinMatrix?.sgr_bonus_min_odds || 1.3;
    const maxGames = dbWinMatrix?.sgr_bonus_max_games || 30;

    let qualifyingGames = slips.filter(
        (slip) => Number(slip?.odd_value) > minOdds
    ).length;

    if (qualifyingGames > maxGames) {
        qualifyingGames = maxGames;
    }

    const bonusKey = `sgr_bonus_percent_${qualifyingGames}`;
    const nextKey = `sgr_bonus_percent_${qualifyingGames + 1}`;

    if (!dbWinMatrix || !Object.keys(dbWinMatrix).length) {
        return "Select 3 or more games to win big bonus";
    }

    if (!(bonusKey in dbWinMatrix)) {
        return "Select 4 games or more above 1.30 to get a bonus";
    }

    if (qualifyingGames === 1) {
        return `Add 3 more games ${minOdds} to win a bonus of ${dbWinMatrix.sgr_bonus_percent_4}% from 4 games`;
    }

    if (qualifyingGames === 2) {
        return `Add 2 more games of odds ${minOdds} to win a bonus of ${dbWinMatrix.sgr_bonus_percent_4}% on 4 games`;
    }

    if (qualifyingGames === 3) {
        return `Add 1 more game of odds ${minOdds} to win a bonus of ${dbWinMatrix.sgr_bonus_percent_4}% on 4 games`;
    }

    if (qualifyingGames > 3 && qualifyingGames <= maxGames) {
        const nextCentage = dbWinMatrix[nextKey];
        return `Congratulations, you have won a bonus of ${dbWinMatrix[bonusKey]}% on ${qualifyingGames} games of ${minOdds} odds. Add 1 more game of ${minOdds} odds to win a bonus of ${nextCentage}%`;
    }

    if (qualifyingGames > maxGames) {
        return `Congratulations: you have won a bonus of 100% on ${qualifyingGames} games of more than ${minOdds} odds`;
    }

    return "Select 3 or more games to win big bonus";
}
