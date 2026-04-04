import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert
} from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";
import CasinoGame from "./CasinoGame";

interface Props {
    gamestype: string;
    games: any[];
    gamesprovider?: any;
}

const CategoryListing: React.FC<Props> = ({
    gamestype,
    games,
    gamesprovider
}) => {

    const navigation: any = useNavigation();
    const route: any = useRoute();

    const { filterType } = route.params || {};
    const isShowingAll = route?.params?.showAll === true;


    const fetchAllCategoryGames = (gameType: string) => {

        if (filterType === "providers") {

            navigation.navigate("Casino", {
                filterType: "providers",
                gameType,
                showAll: true
            });

        } else if (filterType === "providercategory") {

            if (gamesprovider?.id) {

                navigation.navigate("Casino", {
                    filterType: "providercategory",
                    providerId: gamesprovider.id,
                    gameType,
                    showAll: true
                });

            }

        } else {

            navigation.navigate("Casino", {
                filterType: "categories",
                gameType,
                showAll: true
            });

        }

    };

    if (!Array.isArray(games)) return null;

    const renderGame = ({ item }: any) => (
        <View style={styles.gameItem}>
            <CasinoGame game={item} />
        </View>
    );

    return (
        <View style={styles.container}>

            {!isShowingAll && (

                <View style={styles.header}>

                    <Text style={styles.title}>
                        {gamestype}
                    </Text>

                    <TouchableOpacity
                        onPress={() => fetchAllCategoryGames(gamestype)}
                    >
                        <Text style={styles.allButton}>
                            All
                        </Text>
                    </TouchableOpacity>

                </View>

            )}

            <FlatList
                data={games}
                renderItem={renderGame}
                keyExtractor={(item, index) =>
                    `${item?.provider_name || "provider"}-${item?.game_name || item?.id || index}`
                }
                numColumns={3}
                scrollEnabled={false}
            />

        </View>
    );
};

export default React.memo(CategoryListing);

const styles = StyleSheet.create({

    container: {
        marginBottom: 20
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginBottom: 10,
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff"
    },

    allButton: {
        fontSize: 14,
        color: "#38bdf8"
    },

    gameItem: {
        flex: 1,
        margin: 4
    }

});
