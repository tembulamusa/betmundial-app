import { setItem } from "./local-storage";

type LaunchGame = {
    game_id: string | number;
    game_name?: string;
    provider_name?: string;
    aggregator?: string;
};

export function buildCasinoLaunchEndpoint(
    game: LaunchGame,
    moneyType: number,
    isMobile = true
): string {
    let endpoint = `${game?.aggregator ? game.aggregator : game?.provider_name}/casino/game-url/${
        isMobile ? "mobile" : "desktop"
    }/${moneyType}/${game.game_id}`;

    if (game?.aggregator?.toLowerCase() === "intouchvas") {
        endpoint = `${endpoint}-${game?.provider_name}`;
    }

    return endpoint;
}

export function getCasinoLaunchNavParams(game: LaunchGame) {
    return {
        provider: game?.provider_name?.split(" ").join("-").toLowerCase() ?? "provider",
        game: game?.game_name?.split(" ").join("-").toLowerCase() ?? "game",
    };
}

export function persistCasinoLaunch(
    dispatch: (action: any) => void,
    game: LaunchGame,
    url: string,
    bitvillePayload?: any
) {
    const payload = { game, url };
    dispatch({ type: "SET", key: "casinolaunch", payload });

    if (bitvillePayload) {
        dispatch({ type: "SET", key: "bitvilleGame", payload: bitvillePayload });
    }

    void setItem("casinolaunch", payload);
}
