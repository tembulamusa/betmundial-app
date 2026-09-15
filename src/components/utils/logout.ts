type LogoutParams = {
    dispatch: (action: { type: string; key?: string; payload?: any }) => void;
    navigation: {
        reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
    };
    beforeReset?: () => void;
};

/**
 * Log out immediately: update UI/navigation first, clear storage in the background.
 * Callers that need a drawer close animation should run it before invoking this.
 */
export const logoutUser = async ({
    dispatch,
    navigation,
    beforeReset,
}: LogoutParams) => {
    beforeReset?.();

    // Clear in-memory session first so the UI reacts instantly.
    dispatch({ type: "DEL", key: "user" });

    navigation.reset({
        index: 0,
        routes: [{ name: "Sports" }],
    });

    // Persist after navigation so AsyncStorage latency never blocks the tap.
    const { removeItem } = await import("./local-storage");
    void removeItem("user");
};
