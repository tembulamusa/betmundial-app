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

export type BonusAdvice = {
    status: string | null;
    statusBoost?: string | null;
    nudgeTitle: string | null;
    nudgeSub: string | null;
};

const emptyBonusAdvice: BonusAdvice = {
    status: "Select 3 or more games to win big bonus",
    nudgeTitle: null,
    nudgeSub: null,
};

const readBonusPercent = (
    dbWinMatrix: Record<string, any> | undefined,
    games: number
) => {
    const raw = dbWinMatrix?.[`sgr_bonus_percent_${games}`];
    if (raw == null || raw === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
};

const getMaxBongeBonus = (dbWinMatrix?: Record<string, any>) => {
    if (!dbWinMatrix) {
        return { maxPercent: null as number | null, maxGamesWithPercent: null as number | null };
    }

    let maxPercent: number | null = null;
    let maxGamesWithPercent: number | null = null;
    const configuredMax = Number(dbWinMatrix.sgr_bonus_max_games) || null;

    Object.keys(dbWinMatrix).forEach((key) => {
        const match = key.match(/^sgr_bonus_percent_(\d+)$/);
        if (!match) return;
        const games = Number(match[1]);
        if (configuredMax && games > configuredMax) return;
        const percent = readBonusPercent(dbWinMatrix, games);
        if (percent == null) return;
        if (
            maxPercent == null ||
            percent > maxPercent ||
            (percent === maxPercent &&
                maxGamesWithPercent != null &&
                games > maxGamesWithPercent)
        ) {
            maxPercent = percent;
            maxGamesWithPercent = games;
        }
    });

    return { maxPercent, maxGamesWithPercent };
};

/** Percent for N qualifying games — mirrors web `resolveBongeBonusPercent`. */
export const resolveBongeBonusPercent = (
    dbWinMatrix: Record<string, any> | undefined,
    qualifyingGames: number
) => {
    if (!dbWinMatrix) return 0;
    const maxGames = Number(dbWinMatrix.sgr_bonus_max_games) || null;
    let games = Number(qualifyingGames) || 0;
    if (maxGames && games > maxGames) games = maxGames;
    const current = readBonusPercent(dbWinMatrix, games);
    if (current != null) return current;
    const { maxPercent } = getMaxBongeBonus(dbWinMatrix);
    return maxPercent != null ? maxPercent : 0;
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

    const bonusPercent = resolveBongeBonusPercent(dbWinMatrix, qualifyingGames);

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

/** Mirrors web `buildBongeBonusAdvice`. */
export function buildBonusAdvice(
    slips: any[],
    dbWinMatrix?: Record<string, any>
): BonusAdvice {
    if (!dbWinMatrix || !Object.keys(dbWinMatrix).length) {
        return { ...emptyBonusAdvice };
    }

    const oddLimit = dbWinMatrix?.sgr_bonus_min_odds || 1.3;
    const maxGames = Number(dbWinMatrix?.sgr_bonus_max_games) || null;
    let totalGames = slips.filter(
        (slip) => Number(slip?.odd_value) > Number(oddLimit)
    ).length;

    if (maxGames && totalGames > maxGames) {
        totalGames = maxGames;
    }

    const minOddsLabel = `${oddLimit} minimum odds per game`;
    const percent4 = readBonusPercent(dbWinMatrix, 4);
    const { maxPercent, maxGamesWithPercent } = getMaxBongeBonus(dbWinMatrix);

    const maxReachedMessage = (percent: number): BonusAdvice => ({
        status: `Congratulations, you have reached the maximum bonus of ${percent}%`,
        statusBoost: `${percent}%`,
        nudgeTitle: null,
        nudgeSub: null,
    });

    if (totalGames === 0) {
        return {
            status: `Select 4 games or more above ${oddLimit} to get a bonus`,
            nudgeTitle: null,
            nudgeSub: null,
        };
    }

    if (totalGames === 1) {
        return {
            status: null,
            nudgeTitle:
                percent4 != null
                    ? `Add 3 more to get a ${percent4}% boost!`
                    : "Add 3 more to unlock a boost!",
            nudgeSub: minOddsLabel,
        };
    }

    if (totalGames === 2) {
        return {
            status: null,
            nudgeTitle:
                percent4 != null
                    ? `Add 2 more to get a ${percent4}% boost!`
                    : "Add 2 more to unlock a boost!",
            nudgeSub: minOddsLabel,
        };
    }

    if (totalGames === 3) {
        return {
            status: null,
            nudgeTitle:
                percent4 != null
                    ? `Add 1 more to get a ${percent4}% boost!`
                    : "Add 1 more to unlock a boost!",
            nudgeSub: minOddsLabel,
        };
    }

    const current = readBonusPercent(dbWinMatrix, totalGames);
    const next = readBonusPercent(dbWinMatrix, totalGames + 1);
    const hitConfiguredMaxGames = Boolean(maxGames && totalGames >= maxGames);
    const hitHighestDefinedTier = Boolean(
        maxGamesWithPercent && totalGames >= maxGamesWithPercent
    );
    const nextMissing = next == null;
    const atMaximum =
        current != null &&
        (nextMissing || hitConfiguredMaxGames || hitHighestDefinedTier);

    if (atMaximum) {
        return maxReachedMessage(current);
    }

    if (current != null && next != null) {
        return {
            status: `Your Multibet of ${totalGames} selections gives you a boost of ${current}%`,
            statusBoost: `${current}%`,
            nudgeTitle: `Add 1 more to get a ${next}% boost!`,
            nudgeSub: minOddsLabel,
        };
    }

    if (
        maxPercent != null &&
        (hitConfiguredMaxGames || hitHighestDefinedTier || nextMissing)
    ) {
        return maxReachedMessage(maxPercent);
    }

    return { ...emptyBonusAdvice };
}
