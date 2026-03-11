import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Context } from "../../../context/store";

interface Category {
    id: number;
    name: string;
}

const MobileCategoriesMenu: React.FC = () => {

    const [state, dispatch] = useContext(Context);

    const [categories, setCategories] = useState<Category[]>([]);
    const [providers, setProviders] = useState<any[]>([]);

    const navigation: any = useNavigation();

    const getSportImageIcon = (sportName: string) => {

        try {
            return require(`../../../assets/img/casino/icons/${sportName}.png`);
        } catch {
            return require(`../../../assets/img/casino/icons/SetDefault.png`);
        }

    };

    useEffect(() => {

        setCategories(state?.casinofilters?.gameTypes || []);
        setProviders(state?.casinofilters?.providers || []);

    }, [state?.casinofilters]);

    useEffect(() => {

        const loadFilters = async () => {

            const availableFilters = await AsyncStorage.getItem("casinofilters");

            if (availableFilters) {

                dispatch({
                    type: "SET",
                    key: "casinofilters",
                    payload: JSON.parse(availableFilters)
                });

            }

        };

        loadFilters();

    }, []);

    const filterGames = async (filterName: string, filterItem: any) => {

        const payload = { filterType: "category", category: filterItem };

        if (filterName === "category") {

            if (filterItem?.name?.toLowerCase() === "surecoin") {

                navigation.navigate("Surecoin");

            } else {

                await AsyncStorage.setItem(
                    "casinogamesfilter",
                    JSON.stringify(payload)
                );

                dispatch({
                    type: "SET",
                    key: "casinogamesfilter",
                    payload
                });

                navigation.navigate("CasinoCategory", {
                    category: filterItem?.name?.split(" ").join("")
                });

            }

        } else {

            await AsyncStorage.removeItem("casinogamesfilter");

            dispatch({
                type: "DEL",
                key: "casinogamesfilter"
            });

            navigation.navigate("Casino");

        }

    };

    const CasinoCategories = () => (

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scroll}
        >

            <TouchableOpacity
                style={styles.item}
                onPress={() => filterGames("all", "")}
            >
                <Image
                    source={getSportImageIcon("home")}
                    style={styles.icon}
                />
                <Text style={styles.name}>
                    All Games
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.item}
                onPress={() => filterGames("popular", "popular")}
            >
                <Image
                    source={getSportImageIcon("popular")}
                    style={styles.icon}
                />
                <Text style={styles.name}>
                    Popular
                </Text>
            </TouchableOpacity>

            {categories?.map((category, idx) => (

                <TouchableOpacity
                    key={idx}
                    style={[
                        styles.item,
                        state?.casinogamesfilter?.category?.id === category?.id &&
                        styles.active
                    ]}
                    onPress={() => filterGames("category", category)}
                >

                    <Image
                        source={getSportImageIcon(category.name)}
                        style={styles.icon}
                    />

                    <Text style={styles.name}>
                        {category?.name}
                    </Text>

                </TouchableOpacity>

            ))}

        </ScrollView>

    );

    return (

        <View style={styles.container}>

            <CasinoCategories />

        </View>

    );

};

export default React.memo(MobileCategoriesMenu);

const styles = StyleSheet.create({

    container: {
        backgroundColor: "#020617",
        paddingVertical: 10
    },

    scroll: {
        paddingHorizontal: 10
    },

    item: {
        alignItems: "center",
        marginRight: 16
    },

    icon: {
        width: 40,
        height: 40,
        marginBottom: 4
    },

    name: {
        color: "#fff",
        fontSize: 12,
        textAlign: "center"
    },

    active: {
        opacity: 0.6
    }

});