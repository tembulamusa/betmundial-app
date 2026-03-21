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

interface MenuItem {
    name: string;
    icon: string;
    link: string;
    custom?: boolean;
    provider?: string;
    aggregator?: string;
    gameName?: string;
}

const HeaderNav: React.FC = () => {
    const scrollRef = useRef<ScrollView>(null);
    const [state] = useContext(Context);
    const [categories, setCategories] = useState<any[]>([]);
    const [casinoProviders, setCasinoProviders] = useState<any[]>([]);
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

        if (item?.custom) {
            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: item.provider,
                    gameName: item.gameName,
                },
            });
        } else {
            navigation.navigate("Sports", { screen: item.link });
        }
    };

    useEffect(() => {
        const providers = state?.casinofilters?.providers || [];
        const filteredProviders = providers.filter(
            (p: any) => p?.name?.toLowerCase() !== "unicraft"
        );
        setCasinoProviders(filteredProviders);
    }, [state?.casinofilters]);

    useEffect(() => {
        if (state?.categories && Array.isArray(state?.categories)) {
            setCategories(state?.categories);
        }
    }, [state?.categories]);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                ref={scrollRef}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* Static Links */}
                {linkItems.map((item, idx) => {
                    const Icon = NavIcon(item.icon);

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={styles.menuItem}
                            onPress={() => onPressMenuItem(item)}
                        >
                            <Icon width={40} height={40} />
                            <Text style={styles.name}>{item.name}</Text>
                        </TouchableOpacity>
                    );
                })}

                {/* Categories */}
                {categories.map((cat, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.menuItem}
                        onPress={() =>
                            onPressMenuItem(`SportMatchesScreen_${cat.sport_id}`)
                        }
                    >
                        <Text style={styles.name}>{cat.sport_name}</Text>
                    </TouchableOpacity>
                ))}

                {/* Casino Providers */}
                {casinoProviders?.map((provider, idx) => {
                    const lower = provider.name.toLowerCase();
                    if (["aviatrix", "pragmatic", "bitville"].includes(lower)) return null;

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={styles.menuItem}
                            onPress={() =>
                                onPressMenuItem(`CasinoProviderScreen_${provider.name}`)
                            }
                        >
                            <Text style={styles.name}>{provider.name}</Text>
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
        paddingVertical: 10,
        backgroundColor: "transparent",
    },
    scrollContent: {
        alignItems: "center",
        paddingHorizontal: 10,
    },
    menuItem: {
        width: 70,
        marginHorizontal: 5,
        alignItems: "center",
    },
    name: {
        color: "#fff",
        fontSize: 12,
        textAlign: "center",
    },
});