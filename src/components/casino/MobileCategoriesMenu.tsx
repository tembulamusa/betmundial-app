import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Context } from "../../context/store";
import { CasinoIcon } from "../utils/CasinoIcons";

interface Category {
    id: number;
    name: string;
}

const MobileCategoriesMenu: React.FC = () => {

    const [state, dispatch] = useContext(Context);

    const [categories, setCategories] = useState<Category[]>([]);
    const [activeKey, setActiveKey] = useState("all");
    const navigation: any = useNavigation();

    useEffect(() => {

        setCategories(state?.casinofilters?.gameTypes || []);

    }, [state?.casinofilters]);

    useEffect(() => {
        if (state?.casinogamesfilter?.category?.id) {
            setActiveKey(`category-${state.casinogamesfilter.category.id}`);
            return;
        }

        setActiveKey("all");
    }, [state?.casinogamesfilter?.category?.id]);

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

    }, [dispatch]);

    const filterGames = async (filterName: string, filterItem: any) => {
        if (filterName === "category") {
            const payload = { filterType: "category", category: filterItem };
            setActiveKey(`category-${filterItem?.id}`);

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
            setActiveKey(filterName);

            await AsyncStorage.removeItem("casinogamesfilter");

            dispatch({
                type: "DEL",
                key: "casinogamesfilter"
            });

            navigation.navigate("Casino");
        }

    };

    const renderCasinoIcon = (name: string) => {
        const Icon = CasinoIcon(name);
        return <Icon width={20} height={20} style={styles.icon} />;
    };

    const CasinoCategories = () => (

        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scroll}
        >

            <TouchableOpacity
                style={[
                    styles.item,
                    activeKey === "all" && styles.activeItem
                ]}
                onPress={() => filterGames("all", "")}
            >
                {renderCasinoIcon("all")}
                <Text style={[
                    styles.name,
                    activeKey === "all" && styles.activeName
                ]}>
                    All Games
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.item,
                    activeKey === "popular" && styles.activeItem
                ]}
                onPress={() => filterGames("popular", "popular")}
            >
                {renderCasinoIcon("popular")}
                <Text style={[
                    styles.name,
                    activeKey === "popular" && styles.activeName
                ]}>
                    Popular
                </Text>
            </TouchableOpacity>

            {categories?.map((category, idx) => (
                <TouchableOpacity
                    key={idx}
                    style={[
                        styles.item,
                        activeKey === `category-${category?.id}` && styles.activeItem
                    ]}
                    onPress={() => filterGames("category", category)}
                >
                    {renderCasinoIcon(category?.name)}
                    <Text style={[
                        styles.name,
                        activeKey === `category-${category?.id}` && styles.activeName
                    ]}>
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
        backgroundColor: "rgba(255,255,255,0.1)",
        paddingVertical: 4
    },

    scroll: {
        paddingHorizontal: 10
    },

    item: {
        alignItems: "center",
        marginRight: 32,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: "transparent"
    },

    icon: {
        width: 20,
        height: 20,
        marginBottom: 4
    },

    name: {
        color: "#fff",
        fontSize: 12,
        textAlign: "center"
    },

    activeName: {
        color: "#a71f66",
        fontWeight: "700"
    },

    activeItem: {
        borderBottomColor: "#a71f66"
    }

});
