export const LOGIN_REDIRECT_KEY = "loginRedirect";

export type LoginRedirectTarget = {
    name: string;
    params?: Record<string, unknown>;
};

/** Intended destination after login for Affiliate. */
export const AFFILIATE_LOGIN_REDIRECT: LoginRedirectTarget = {
    name: "Sports",
    params: { screen: "AffiliateScreen" },
};

/**
 * Open the login modal and remember where to send the user after success.
 */
export const openLoginWithRedirect = (
    dispatch: (action: { type: string; key: string; payload?: unknown }) => void,
    target?: LoginRedirectTarget | null
) => {
    if (target) {
        dispatch({ type: "SET", key: LOGIN_REDIRECT_KEY, payload: target });
    }
    dispatch({ type: "SET", key: "showloginmodal", payload: true });
};

export const clearLoginRedirect = (
    dispatch: (action: { type: string; key: string }) => void
) => {
    dispatch({ type: "DEL", key: LOGIN_REDIRECT_KEY });
};

export const navigateLoginRedirect = (
    navigation: { navigate: (name: string, params?: Record<string, unknown>) => void },
    target: LoginRedirectTarget | null | undefined
) => {
    if (!target?.name) return false;
    if (target.params) {
        navigation.navigate(target.name, target.params);
    } else {
        navigation.navigate(target.name);
    }
    return true;
};
