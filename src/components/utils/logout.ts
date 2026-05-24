import { InteractionManager } from "react-native";
import { removeItem } from "./local-storage";

type LogoutParams = {
    dispatch: (action: { type: string; key?: string; payload?: any }) => void;
    navigation: {
        reset: (config: { index: number; routes: Array<{ name: string }> }) => void;
    };
    beforeReset?: () => void;
};

export const logoutUser = async ({
    dispatch,
    navigation,
    beforeReset,
}: LogoutParams) => {
    await removeItem("user");
    dispatch({ type: "DEL", key: "user" });

    beforeReset?.();

    InteractionManager.runAfterInteractions(() => {
        navigation.reset({
            index: 0,
            routes: [{ name: "Sports" }],
        });
    });
};
