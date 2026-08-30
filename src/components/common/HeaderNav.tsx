import React, {
    useRef,
    useState,
    useEffect,
    useContext,
    useCallback,
    useMemo,
    memo,
} from "react";

import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";
import { NavIcon } from "../utils/NavIcon";
import { CasinoIcon } from "../utils/CasinoIcons";
import { makeRequest } from "../utils/makeRequest";
import { getItem, setItem } from "../utils/local-storage";
import { theme } from "../../theme";

type NavBadge = "hot" | "new";

/** Title-case each word — RN Android often ignores textTransform: capitalize */
const capitalizeWords = (value: string) =>
    value
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

type LinkItem = {
    name: string;
    icon: string;
    link?: string;
    custom?: boolean;
    provider?: string;
    gameName?: string;
    badge?: NavBadge;
};

/* ================= INLINE MENU ITEM (icon + label row) ================= */
const MenuItem = memo(({ item, active, onPress }: { item: LinkItem; active: boolean; onPress: () => void }) => {
    const Icon = useMemo(() => NavIcon(item.icon), [item.icon]);
    const displayName = capitalizeWords(item.name);

    return (
        <TouchableOpacity
            style={[styles.menuItem, active && styles.activeItem, item.badge && styles.menuItemWithBadge]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.iconWrap}>
                <Icon width={22} height={22} />
            </View>
            <View style={[styles.labelWrap, item.badge && styles.labelWrapWithBadge]}>
                <Text style={[styles.name, active && styles.activeName]} numberOfLines={1}>
                    {displayName}
                </Text>
                {item.badge ? (
                    <View style={styles.badgeBubble}>
                        <Text
                            style={styles.badgeText}
                            numberOfLines={1}
                            allowFontScaling={false}
                        >
                            {item.badge === "hot" ? "HOT" : "NEW"}
                        </Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );
});

/* ================= CASINO PROVIDER ITEM ================= */
const CasinoItem = memo(({ provider, active, onPress }: { provider: any; active: boolean; onPress: () => void }) => {
    const Icon = useMemo(() => CasinoIcon(provider.name), [provider.name]);

    return (
        <TouchableOpacity
            style={[styles.menuItem, active && styles.activeItem]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <View style={styles.iconWrap}>
                <Icon width={22} height={22} />
            </View>
            <Text style={[styles.name, active && styles.activeName]} numberOfLines={1}>
                {capitalizeWords(provider.name)}
            </Text>
        </TouchableOpacity>
    );
});

/* ================= HEADER NAV ================= */
type HeaderNavProps = {
    containerStyle?: StyleProp<ViewStyle>;
};

const HeaderNav: React.FC<HeaderNavProps> = ({ containerStyle }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation<any>();

    const [categories, setCategories] = useState<any[]>([]);
    const [casinoProviders, setCasinoProviders] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState<string>("home");

    /* Web mobile nav order & labels (betmundial.com) */
    const linkItems = useMemo<LinkItem[]>(
        () => [
            { name: "Home", icon: "home.svg", link: "HomeScreen" },
            { name: "live", icon: "livescore.svg", link: "LiveScreen" },
            { name: "jackpot", icon: "jackpot.svg", link: "JackpotScreen" },
            {
                name: "aviator",
                icon: "aviator.svg",
                custom: true,
                provider: "spribe",
                gameName: "aviator",
                badge: "hot",
            },
            {
                name: "jet x",
                icon: "jetx.svg",
                custom: true,
                provider: "smartsoft",
                gameName: "jetx",
                badge: "new",
            },
            {
                name: "aviatrix",
                icon: "aviatrix.svg",
                custom: true,
                provider: "aviatrix",
                gameName: "aviatrix",
                badge: "hot",
            },
            {
                name: "mundial league",
                icon: "mundial-league.svg",
                custom: true,
                provider: "unicraft",
                gameName: "mundial-league",
                badge: "new",
            },
            { name: "casino", icon: "casino.svg", link: "CasinoScreen" },
            { name: "Crash", icon: "casino.svg", link: "CasinoScreen", badge: "new" },
            { name: "promotions", icon: "jackpot.svg", link: "PromotionsScreen" },
            { name: "livescore", icon: "livescore.svg", link: "LiveScreen" },
        ],
        []
    );

    const navigateDeferred = useCallback((callback: () => void) => {
        callback();
    }, []);

    const itemKey = (item: LinkItem) => item.name.toLowerCase();

    const onPressMenuItem = useCallback(
        (item: LinkItem) => {
            setActiveKey(itemKey(item));

            if (item.link === "HomeScreen") {
                navigation.navigate("Sports", { screen: "HomeMain" });
                navigateDeferred(() => {
                    dispatch({ type: "SET", key: "playType", payload: "sports" });
                    dispatch({ type: "DEL", key: "filtercompetition" });
                    dispatch({ type: "DEL", key: "filtercategory" });
                    dispatch({
                        type: "SET",
                        key: "filtersport",
                        payload: { sport_id: 79, sport_name: "soccer" },
                    });
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

            if (item.link === "PromotionsScreen") {
                navigation.navigate("Sports", { screen: "PromotionsScreen" });
                navigateDeferred(() => {
                    dispatch({ type: "SET", key: "playType", payload: "sports" });
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
        },
        [navigation, dispatch, navigateDeferred]
    );

    const onPressSportCategory = useCallback(
        (cat: any) => {
            setActiveKey(`sport-${cat?.sport_id}`);
            navigation.navigate("Sports", { screen: "HomeMain" });
            navigateDeferred(() => {
                dispatch({ type: "SET", key: "filtersport", payload: cat });
                dispatch({ type: "DEL", key: "filtercompetition" });
                dispatch({ type: "DEL", key: "filtercategory" });
                dispatch({ type: "SET", key: "playType", payload: "sports" });
                setItem("filtersport", cat);
            });
        },
        [dispatch, navigateDeferred, navigation]
    );

    const openCasinoProvider = useCallback(
        (provider: any) => {
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
        },
        [navigation, dispatch, navigateDeferred]
    );

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
    }, [state?.playType, state?.filtersport?.sport_id, state?.casinogamesfilter?.provider?.id]);

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
            } catch (_) {
                // ignore
            }
        };

        fetchCategories();

        if (!state?.filtersport) {
            dispatch({
                type: "SET",
                key: "filtersport",
                payload: { sport_id: 79, sport_name: "soccer" },
            });
        }
    }, [dispatch, state?.filtersport]);

    return (
        <View style={[styles.container, containerStyle]}>
            <ScrollView
                horizontal
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {linkItems.map((item, idx) => (
                    <MenuItem
                        key={`${item.name}-${idx}`}
                        item={item}
                        active={activeKey === itemKey(item)}
                        onPress={() => onPressMenuItem(item)}
                    />
                ))}

                {(state?.playType === "sports" || !state?.playType) &&
                    categories.map((cat, idx) => {
                        const Icon = NavIcon(cat.sport_name.toLowerCase());
                        const key = `sport-${cat.sport_id}`;
                        return (
                            <TouchableOpacity
                                key={key || idx}
                                style={[styles.menuItem, activeKey === key && styles.activeItem]}
                                onPress={() => onPressSportCategory(cat)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.iconWrap}>
                                    <Icon width={22} height={22} />
                                </View>
                                <Text
                                    style={[styles.name, activeKey === key && styles.activeName]}
                                    numberOfLines={1}
                                >
                                    {capitalizeWords(cat.sport_name)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                {state?.playType === "casino" &&
                    casinoProviders.map((provider, idx) => (
                        <CasinoItem
                            key={provider.id || idx}
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

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: theme.mainTabsBackground,
        marginTop: 4,
    },
    scrollContent: {
        alignItems: "center",
        paddingHorizontal: 6,
        paddingTop: 8,
        paddingBottom: 6,
    },
    menuItem: {
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        marginHorizontal: 2,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
        overflow: "visible",
    },
    menuItemWithBadge: {
        paddingTop: 10,
        paddingRight: 12,
        overflow: "visible",
    },
    iconWrap: {
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 5,
    },
    labelWrap: {
        position: "relative",
        flexShrink: 0,
        justifyContent: "center",
    },
    labelWrapWithBadge: {
        paddingRight: 18,
        paddingTop: 4,
        overflow: "visible",
    },
    name: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "500",
        opacity: 0.85,
    },
    activeItem: {
        borderBottomColor: theme.accent,
    },
    activeName: {
        opacity: 1,
        fontWeight: "600",
    },
    badgeBubble: {
        position: "absolute",
        top: -8,
        right: -4,
        backgroundColor: "#ff3b3b",
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        zIndex: 10,
        minWidth: 34,
        height: 15,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    badgeText: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "700",
        textTransform: "uppercase",
        lineHeight: 10,
        letterSpacing: 0.2,
        textAlign: "center",
        includeFontPadding: false,
    },
});
