import React, { useRef, useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";
import { NavIcon } from "../utils/NavIcon";
import { CasinoIcon } from "../utils/CasinoIcons";
import { makeRequest } from "../utils/makeRequest";
import { getItem, setItem } from "../utils/local-storage";
import { theme } from "../../theme";

interface MenuItem {
    name: string;
    icon: string;
    link: string;
    custom?: boolean;
    provider?: string;
    aggregator?: string;
    gameName?: string;
}

interface CasinoProvider {
    id: number | string;
    name: string;
}

const HeaderNav: React.FC = () => {
    const scrollRef = useRef<ScrollView>(null);
    const [state, dispatch] = useContext(Context);
    const [categories, setCategories] = useState<any[]>([]);
    const [casinoProviders, setCasinoProviders] = useState<any[]>([]);
    const [activeKey, setActiveKey] = useState<string>("home");
    const navigation = useNavigation<any>();

    const linkItems: MenuItem[] = [
        { name: "Home", icon: "home.svg", link: "HomeScreen" },
        { name: "live", icon: "livescore.svg", link: "LiveScreen" },
        { name: "jackpot", icon: "jackpot.svg", link: "JackpotScreen" },
        {
            name: "aviator",
            icon: "aviator.svg",
            link: "",
            custom: true,
            provider: "spribe",
            aggregator: "Bitville",
            gameName: "aviator",
        },
        {
            name: "mundial league",
            icon: "mundial-league.svg",
            link: "",
            custom: true,
            provider: "unicraft",
            gameName: "mundial-league",
        },
    ];

    const onPressMenuItem = (item: MenuItem | string) => {
        if (typeof item === "string") {
            navigation.navigate("Sports", { screen: item });
            return;
        }

        setActiveKey(item.name.toLowerCase());

        if (item?.custom) {
            dispatch({
                type: "SET",
                key: "playType",
                payload: "casino",
            });

            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: item.provider,
                    game: item.gameName,
                },
            });
            return;
        }

        navigation.navigate("Sports", { screen: item.link });
    };

    const onPressSportCategory = (cat: any) => {
        setActiveKey(`sport-${cat?.sport_id}`);
        dispatch({
            type: "SET",
            key: "filtersport",
            payload: cat,
        });
    };

    const openCasinoProvider = async (provider: CasinoProvider) => {
        setActiveKey(`provider-${provider.id}`);
        const payload = {
            filterType: "providers",
            provider,
            page: 1,
        };

        await setItem("casinogamesfilter", payload);

        dispatch({
            type: "SET",
            key: "casinogamesfilter",
            payload,
        });

        dispatch({
            type: "SET",
            key: "playType",
            payload: "casino",
        });

        navigation.navigate("Casino");
    };

    useEffect(() => {
        const providers = state?.casinofilters?.providers || [];
        const filteredProviders = providers.filter(
            (p: any) => p?.name?.toLowerCase() !== "unicraft"
        );
        setCasinoProviders(filteredProviders);
    }, [state?.casinofilters]);

    useEffect(() => {
        if (state?.playType === "casino" && state?.casinogamesfilter?.provider?.id) {
            setActiveKey(`provider-${state.casinogamesfilter.provider.id}`);
            return;
        }

        if (state?.playType !== "casino" && state?.filtersport?.sport_id) {
            setActiveKey(`sport-${state.filtersport.sport_id}`);
        }
    }, [
        state?.playType,
        state?.casinogamesfilter?.provider?.id,
        state?.filtersport?.sport_id
    ]);

    useEffect(() => {
        if (!state?.filtersport?.sport_id) return;

        const fetchTopCompetitions = async () => {
            try {
                const res = await makeRequest<any>({
                    url: `/sports/competitions/${state?.filtersport?.sport_id}`,
                    method: "GET",
                    apiVersion: 2,
                });
                const data = res?.data?.data?.items || [];
                await setItem("topcompetitions", data);
                dispatch({
                    type: "SET",
                    key: "topcompetitions",
                    payload: data,
                });
            } catch (err) {
                console.error("Error fetching top competitios:", err);
            }
        };

        fetchTopCompetitions();
    }, [dispatch, state?.filtersport?.sport_id]);

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

                await setItem("categories", data);
                setCategories(data);
            } catch (error) {
                console.error("Error fetching categories:", error);
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
        <View style={styles.container}>
            <ScrollView
                horizontal
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {linkItems.map((item, idx) => {
                    const Icon = NavIcon(item.icon);

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.menuItem,
                                activeKey === item.name.toLowerCase() && styles.activeItem
                            ]}
                            onPress={() => onPressMenuItem(item)}
                        >
                            <Icon width={28} height={28} />
                            <Text style={[
                                styles.name,
                                activeKey === item.name.toLowerCase() && styles.activeName
                            ]}>{item.name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {(state?.playType === "sports" || !state?.playType) && categories?.map((cat, idx) => {
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
                            ]}>{cat.sport_name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {state?.playType === "casino" && casinoProviders?.map((provider, idx) => {
                    const lower = provider.name.toLowerCase();
                    if (lower === "bitville") return null;

                    const Icon = CasinoIcon(provider.name);

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.menuItem,
                                activeKey === `provider-${provider.id}` && styles.activeItem
                            ]}
                            onPress={() => openCasinoProvider(provider)}
                        >
                            <Icon width={28} height={28} />
                            <Text style={[
                                styles.name,
                                activeKey === `provider-${provider.id}` && styles.activeName
                            ]}>{provider.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default React.memo(HeaderNav);

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
    },
    name: {
        color: "#fff",
        fontSize: 12,
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
