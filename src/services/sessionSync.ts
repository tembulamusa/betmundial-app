import socket from "../components/utils/SocketConnect";
import { makeRequest } from "../components/utils/makeRequest";
import {
    getItem,
    normalizeUser,
    setItem,
} from "../components/utils/local-storage";
import {
    clearSessionAndPromptLogin,
    type SessionDispatch,
} from "./sessionAuth";

export type { SessionDispatch };

export async function persistUser(userData: any) {
    const normalized = normalizeUser(userData);
    await setItem("user", normalized);
    return normalized;
}

export async function fetchUserBalance(user: any) {
    if (!user) return null;

    const response = await makeRequest({
        url: "/user/balance",
        method: "GET",
        apiVersion: 2,
    });

    if (response.status != 200 && response.status != 201) {
        return null;
    }

    const payload: any = response.data?.data ?? response.data;
    if (!payload) return null;

    const bonus = payload.bonus ?? user.bonus ?? user.bonus_balance;

    return {
        ...user,
        ...payload,
        balance: payload.balance ?? user.balance,
        bonus,
        bonus_balance: bonus,
        token: user.token || user.access_token,
        access_token: user.access_token || user.token,
    };
}

export async function handleTokenRefresh(
    user: any,
    dispatch: SessionDispatch
): Promise<any | null> {
    if (!user) {
        return null;
    }

    const response = await makeRequest({
        url: "/auth/token/refresh",
        method: "POST",
        data: { refresh_token: user?.refresh_token },
        apiVersion: 2,
    });

    const httpStatus = response.status;
    const body: any = response.data;

    if (httpStatus == 200 || httpStatus == 201 || httpStatus == 204) {
        if (body?.status == 200 || body?.status == 201) {
            const nextUser = normalizeUser(body?.data);
            await persistUser(nextUser);
            dispatch({ type: "SET", key: "user", payload: nextUser });
            return nextUser;
        }

        await clearSessionAndPromptLogin(dispatch);
        return null;
    }

    await clearSessionAndPromptLogin(dispatch);
    return null;
}

export function reconnectSocket(profileId?: string | number | null) {
    if (!profileId) return;

    const subscribe = () => {
        socket.emit("user.profile", profileId);
    };

    if (!socket.connected) {
        socket.connect();
        socket.once("connect", subscribe);
        return;
    }

    subscribe();
}

export async function syncSessionOnForeground(
    dispatch: SessionDispatch,
    getUser: () => any
) {
    let user = getUser() || (await getItem("user"));
    if (!user) return;

    reconnectSocket(user.profile_id);

    try {
        const nextUser = await fetchUserBalance(user);
        if (nextUser) {
            await persistUser(nextUser);
            dispatch({ type: "SET", key: "user", payload: nextUser });
        }
    } catch (error) {
        console.warn("[sessionSync] Balance refresh failed", error);
    }
}
