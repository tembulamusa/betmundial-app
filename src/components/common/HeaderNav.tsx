import React, {
    useRef,
    useState,
    useEffect,
    useContext,
    useCallback,
    useMemo,
    memo
} from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    InteractionManager
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";
import { NavIcon } from "../utils/NavIcon";
import { CasinoIcon } from "../utils/CasinoIcons";
import { makeRequest } from "../utils/makeRequest";
import { getItem, setItem } from "../utils/local-storage";
import { theme } from "../../theme";

/* ================= MEMO MENU ITEM ================= */
const MenuItem = memo(({ item, active, onPress }: any) => {
    const Icon = useMemo(() => NavIcon(item.icon), [item.icon]);

    return (
        <TouchableOpacity
            style={[styles.menuItem, active && styles.activeItem]}
            onPress={onPress}
        >
            <Icon width={28} height={28} />
            <Text style={[styles.name, active && styles.activeName]}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );
});

/* ================= CASINO ITEM ================= */
const CasinoItem = memo(({ provider, active, onPress }: any) => {
    const Icon = useMemo(() => CasinoIcon(provider.name), [provider.name]);

    return (
        <TouchableOpacity
            style={[styles.menuItem, active && styles.activeItem]}
            onPress={onPress}
        >
            <Icon width={28} height={28} />
            <Text style={[styles.name, active && styles.activeName]}>
                {provider.name}
            </Text>
        </TouchableOpacity>
    );
});

/* ================= HEADER ================= */
const HeaderNav: React.FC = () => {
    const scrollRef = useRef<ScrollView>(null);
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation<any>();

    const [categories, setCategories] = useState<any[]>([]);
    const [casinoProviders, setCasinoProviders] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState<string>("home");

    /* ================= STATIC MENU ================= */
    const linkItems = useMemo(() => [
        { name: "Home", icon: "home.svg", link: "HomeScreen" },
        { name: "live", icon: "livescore.svg", link: "LiveScreen" },
        { name: "jackpot", icon: "jackpot.svg", link: "JackpotScreen" },
        {
            name: "aviator",
            icon: "aviator.svg",
            custom: true,
            provider: "spribe",
            gameName: "aviator",
        },
        {
            name: "aviatrix",
            icon: "aviatrix.svg",
            custom: true,
            provider: "aviatrix",
            gameName: "aviatrix",
        },
        {
            name: "jetx",
            icon: "jetx.svg",
            custom: true,
            provider: "smartsoft",
            gameName: "jetx",
        },
        {
            name: "mundial league",
            icon: "mundial-league.svg",
            custom: true,
            provider: "unicraft",
            gameName: "mundial-league",
        },
        {
            name: "Casino",
            icon: "casino.svg",
            link: "CasinoScreen",
        },
        {
            name: "Crash",
            icon: "casino.svg",
            link: "CasinoScreen",
        },
    ], []);

    /* ================= NAVIGATION HANDLER ================= */
    const navigateDeferred = useCallback((callback: () => void) => {
        InteractionManager.runAfterInteractions(callback);
    }, []);

    const onPressMenuItem = useCallback((item: any) => {
        setActiveKey(item.name.toLowerCase());

        if (item.link === "HomeScreen") {
            navigation.navigate("Sports", { screen: "HomeMain" });

            navigateDeferred(() => {
                dispatch({ type: "SET", key: "playType", payload: "sports" });
            });
            return;
        }

        if (item.link === "LiveScreen") {
            navigation.navigate("Sports", { screen: "LiveScreen" });

            navigateDeferred(() => {
                dispatch({ type: "SET", key: "playType", payload: "sports" });
            });
            return;
        }

        if (item.link === "JackpotScreen") {
            navigation.navigate("Jackpot", { screen: "JackpotMain" });

            navigateDeferred(() => {
                dispatch({ type: "SET", key: "playType", payload: "jackpot" });
            });
            return;
        }
        if (item.link === "CasinoScreen") {
            navigation.navigate("Casino", { screen: "CasinoMain" });

            navigateDeferred(() => {
                dispatch({ type: "SET", key: "playType", payload: "casino" });
            });
            return;
        }

        if (item.custom) {
            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: item.provider,
                    game: item.gameName,
                },
            });

            navigateDeferred(() => {
                dispatch({ type: "SET", key: "playType", payload: "casino" });
            });
            return;
        }

        navigation.navigate("Sports", { screen: item.link });
    }, [navigation, dispatch]);

    /* ================= SPORT CLICK ================= */
    const onPressSportCategory = useCallback((cat: any) => {
        setActiveKey(`sport-${cat?.sport_id}`);

        navigateDeferred(() => {
            dispatch({
                type: "SET",
                key: "filtersport",
                payload: cat,
            });
        });
    }, [dispatch]);

    /* ================= CASINO PROVIDER ================= */
    const openCasinoProvider = useCallback((provider: any) => {
        setActiveKey(`provider-${provider.id}`);

        navigation.navigate("Casino");

        navigateDeferred(() => {
            const payload = {
                filterType: "providers",
                provider,
                page: 1,
            };

            setItem("casinogamesfilter", payload);

            dispatch({ type: "SET", key: "casinogamesfilter", payload });
            dispatch({ type: "SET", key: "playType", payload: "casino" });
        });
    }, [navigation, dispatch]);

    /* ================= EFFECTS ================= */

    useEffect(() => {
        const providers = state?.casinofilters?.providers || [];

        setCasinoProviders(
            providers.filter((p: any) => p?.name?.toLowerCase() !== "unicraft")
        );
    }, [state?.casinofilters]);

    useEffect(() => {
        if (state?.playType === "casino" && state?.casinogamesfilter?.provider?.id) {
            setActiveKey(`provider-${state.casinogamesfilter.provider.id}`);
            return;
        }

        if (state?.filtersport?.sport_id) {
            setActiveKey(`sport-${state.filtersport.sport_id}`);
        }
    }, [state?.playType, state?.filtersport?.sport_id]);

    /* ================= FETCH CATEGORIES ================= */
    useEffect(() => {
        const fetchCategories = async () => {
            const cached = await getItem("categories");

            if (cached) {
                setCategories(cached);
                return;
            }

            try {
                const res = await makeRequest<any>({
                    url: "/sports",
                    method: "GET",
                    apiVersion: 2,
                });

                const data = res?.data?.data || [];

                setCategories(data);
                setItem("categories", data);
            } catch (e) { }
        };

        fetchCategories();

        if (!state?.filtersport) {
            dispatch({
                type: "SET",
                key: "filtersport",
                payload: { sport_id: 79, sport_name: "soccer" },
            });
        }
    }, []);

    /* ================= RENDER ================= */

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* STATIC LINKS */}
                {linkItems.map((item, idx) => (
                    <MenuItem
                        key={idx}
                        item={item}
                        active={activeKey === item.name.toLowerCase()}
                        onPress={() => onPressMenuItem(item)}
                    />
                ))}

                {/* SPORTS */}
                {(state?.playType === "sports" || !state?.playType) &&
                    categories.map((cat, idx) => {
                        const Icon = NavIcon(cat.sport_name.toLowerCase());

                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.menuItem,
                                    activeKey === `sport-${cat.sport_id}` && styles.activeItem
                                ]}
                                onPress={() => onPressSportCategory(cat)}
                            >
                                <Icon width={28} height={28} />
                                <Text style={[
                                    styles.name,
                                    activeKey === `sport-${cat.sport_id}` && styles.activeName
                                ]}>
                                    {cat.sport_name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                {/* CASINO */}
                {state?.playType === "casino" &&
                    casinoProviders.map((provider, idx) => (
                        <CasinoItem
                            key={idx}
                            provider={provider}
                            active={activeKey === `provider-${provider.id}`}
                            onPress={() => openCasinoProvider(provider)}
                        />
                    ))}
            </ScrollView>
        </View>
    );
};

export default memo(HeaderNav);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingTop: 6,
        backgroundColor: theme.background,
    },
    scrollContent: {
        alignItems: "center",
        paddingHorizontal: 10,
    },
    menuItem: {
        marginHorizontal: 5,
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
        textTransform: "capitalize",
    },
    name: {
        color: "#fff",
        fontSize: 12,
        textTransform: "capitalize",
        textAlign: "center",
    },
    activeItem: {
        borderBottomColor: "#a71f66",
    },
    activeName: {
        color: "#a71f66",
        fontWeight: "700",
    },
});