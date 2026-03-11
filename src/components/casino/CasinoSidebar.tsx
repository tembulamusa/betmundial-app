import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Context } from "../../../context/store";
import { useNavigation, useRoute } from "@react-navigation/native";

const CasinoSidebar = () => {

    const [state, dispatch] = useContext(Context);

    const [categories, setCategories] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);

    const navigation = useNavigation();
    const route: any = useRoute();

    const getSportImageIcon = (sportName: string) => {

        try {
            return require(`../../../assets/img/casino/icons/${sportName}.svg`);
        } catch {
            return require(`../../../assets/img/casino/icons/SetDefault.svg`);
        }

    };

    useEffect(() => {

        setCategories(state?.casinofilters?.gameTypes || []);
        setProviders(state?.casinofilters?.providers || []);

    }, [state?.casinofilters]);

    useEffect(() => {

        const loadFilters = async () => {

            const stored = await AsyncStorage.getItem("casinofilters");

            if (stored) {

                dispatch({
                    type: "SET",
                    key: "casinofilters",
                    payload: JSON.parse(stored)
                });

            }

        };

        loadFilters();

    }, []);

    const filterGames = async (filterName: string, filterItem: any) => {

        let payload = {
            filterType: "category",
            category: filterItem
        };

        if (filterName === "category") {

            if (filterItem?.name?.toLowerCase() === "surecoin") {

                navigation.navigate("Surecoin" as never);

            } else {

                await AsyncStorage.setItem(
                    "casinogamesfilter",
                    JSON.stringify(payload)
                );

                dispatch({
                    type: "SET",
                    key: "casinogamesfilter",
                    payload: payload
                });

                navigation.navigate(
                    "CasinoCategory" as never,
                    {
                        category:
                            filterItem?.name
                                ?.split(" ")
                                ?.join("")
                    } as never
                );

            }

        } else {

            await AsyncStorage.removeItem("casinogamesfilter");

            dispatch({
                type: "DEL",
                key: "casinogamesfilter"
            });

            navigation.navigate("Casino" as never);

        }

    };

    const CasinoCategories = () => {

        return (

            <View style={styles.menuCard}>

                <ScrollView>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => filterGames("all", "")}
                    >
                        <Image
                            source={getSportImageIcon("home")}
                            style={styles.icon}
                        />
                        <Text style={styles.text}>
                            All Games
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => filterGames("popular", "popular")}
                    >
                        <Image
                            source={getSportImageIcon("hot")}
                            style={styles.icon}
                        />
                        <Text style={styles.text}>
                            Hot
                        </Text>
                    </TouchableOpacity>

                    {categories.map((category, idx) => (

                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.menuItem,
                                state?.casinogamesfilter?.category?.id === category?.id &&
                                styles.active
                            ]}
                            onPress={() =>
                                filterGames("category", category)
                            }
                        >

                            <Image
                                source={getSportImageIcon(category.name)}
                                style={styles.icon}
                            />

                            <Text style={styles.text}>
                                {category?.name}
                            </Text>

                        </TouchableOpacity>

                    ))}

                </ScrollView>

            </View>

        );

    };

    const CasinoProviders = () => {

        return (

            <View style={styles.menuCard}>

                <Text style={styles.providerHeader}>
                    Providers
                </Text>

                <ScrollView>

                    {providers.map((provider, idx) => (

                        <TouchableOpacity
                            key={idx}
                            style={styles.menuItem}
                            onPress={() =>
                                navigation.navigate(
                                    "CasinoProvider" as never,
                                    {
                                        provider:
                                            provider?.name
                                                ?.split(" ")
                                                ?.join("-"),
                                        id: provider?.id
                                    } as never
                                )
                            }
                        >

                            <Image
                                source={getSportImageIcon(provider.name)}
                                style={styles.icon}
                            />

                            <Text style={styles.text}>
                                {provider?.name}
                            </Text>

                        </TouchableOpacity>

                    ))}

                </ScrollView>

            </View>

        );

    };

    return (

        <View style={styles.sidebar}>

            <Text style={styles.title}>
                Casino
            </Text>

            <CasinoCategories />

        </View>

    );

};

export default React.memo(CasinoSidebar);

const styles = StyleSheet.create({

    sidebar: {
        backgroundColor: "#020617",
        padding: 10,
        flex: 1
    },

    title: {
        fontSize: 26,
        color: "#fff",
        fontWeight: "600",
        marginBottom: 10
    },

    menuCard: {
        backgroundColor: "#111",
        borderRadius: 8,
        padding: 8
    },

    providerHeader: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10
    },

    icon: {
        width: 22,
        height: 22,
        marginRight: 10
    },

    text: {
        color: "#fff",
        fontSize: 15
    },

    active: {
        backgroundColor: "#1e293b",
        borderRadius: 6
    }

});