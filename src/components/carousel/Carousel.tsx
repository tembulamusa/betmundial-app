import React, { useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Image,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    ListRenderItemInfo,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Context } from "../../context/store";

const { width } = Dimensions.get("window");

type CarouselBanner = {
    id: string;
    src: any;
    action?: "game" | "promo";
    provider?: string;
    game?: string;
};

const banners: CarouselBanner[] = [
    {
        id: "mundial-league",
        src: require("../../assets/images/casino/carousel/mundial-league-home-opt.jpeg"),
        action: "game",
        provider: "unicraft",
        game: "mundial-league",
    },
    // {
    //     id: "karibu-bonus",
    //     src: require("../../assets/images/banners/carousel/Karibu-Bonus-opt.jpeg"),
    //     action: "promo",
    // },
    // {
    //     id: "deposit-bonus",
    //     src: require("../../assets/images/banners/carousel/Deposit-Bonus-opt.jpeg"),
    //     action: "promo",
    // },
    {
        id: "aviatrix",
        src: require("../../assets/images/banners/carousel/aviatrix-opt.jpeg"),
        action: "game",
        provider: "aviatrix",
        game: "aviatrix",
    },
    {
        id: "aviator",
        src: require("../../assets/images/banners/carousel/aviator-opt.jpeg"),
        action: "game",
        provider: "spribe",
        game: "aviator",
    },
    {
        id: "fazi-3",
        src: require("../../assets/images/banners/carousel/fazi3.png"),
    },
];

const CarouselLoader: React.FC = () => {
    const navigation = useNavigation<any>();
    const [, dispatch] = useContext(Context);

    const flatListRef = useRef<FlatList<CarouselBanner>>(null);
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: any[] }) => {
            if (viewableItems.length > 0) {
                setActiveIndex(viewableItems[0].index ?? 0);
            }
        }
    ).current;

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % banners.length;

            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });

            setActiveIndex(nextIndex);
        }, 4000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    const handleBannerPress = (banner: CarouselBanner) => {
        if (banner.action === "game" && banner.provider && banner.game) {
            dispatch({ type: "SET", key: "playType", payload: "casino" });
            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: banner.provider,
                    game: banner.game,
                },
            });
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<CarouselBanner>) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleBannerPress(item)}
            disabled={!item.action}
        >
            <Image source={item.src} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
    );

    return (
        <View>
            <FlatList
                ref={flatListRef}
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={renderItem}
            />
        </View>
    );
};

export default React.memo(CarouselLoader);

const styles = StyleSheet.create({
    image: {
        width: width,
        height: 80,
    },
});
