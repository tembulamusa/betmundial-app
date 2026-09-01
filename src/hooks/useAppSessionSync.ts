import { useContext, useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

import { Context } from "../context/store";
import { getItem } from "../components/utils/local-storage";
import { registerSessionDispatch } from "../services/sessionAuth";
import {
    handleTokenRefresh,
    syncSessionOnForeground,
} from "../services/sessionSync";

const TOKEN_REFRESH_INTERVAL_MS = 7 * 60 * 60 * 1000;

export function useAppSessionSync() {
    const [state, dispatch] = useContext(Context);
    const userRef = useRef(state?.user);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const didMountRefreshRef = useRef(false);

    useEffect(() => {
        registerSessionDispatch(dispatch);
    }, [dispatch]);

    useEffect(() => {
        userRef.current = state?.user;
    }, [state?.user]);

    useEffect(() => {
        if (didMountRefreshRef.current) return;
        didMountRefreshRef.current = true;

        const runMountRefresh = async () => {
            const user = userRef.current || (await getItem("user"));
            if (user) {
                await handleTokenRefresh(user, dispatch);
            }
        };

        runMountRefresh();
    }, [dispatch]);

    useEffect(() => {
        if (!state?.user?.profile_id) return;

        syncSessionOnForeground(dispatch, () => userRef.current);

        const appStateSub = AppState.addEventListener("change", (nextState) => {
            const wasBackground =
                appStateRef.current == "inactive" ||
                appStateRef.current == "background";

            if (wasBackground && nextState == "active") {
                syncSessionOnForeground(dispatch, () => userRef.current);
            }

            appStateRef.current = nextState;
        });

        const tokenRefreshTimer = setInterval(() => {
            if (userRef.current) {
                handleTokenRefresh(userRef.current, dispatch);
            }
        }, TOKEN_REFRESH_INTERVAL_MS);

        return () => {
            appStateSub.remove();
            clearInterval(tokenRefreshTimer);
        };
    }, [dispatch, state?.user?.profile_id]);
}
