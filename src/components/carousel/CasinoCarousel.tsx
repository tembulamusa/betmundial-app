import React, { useContext, useEffect, useRef } from "react";
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
import { setItem } from "../utils/local-storage";

const { width } = Dimensions.get("window");

type CarouselBanner = {
    id: string;
    src: any;
    requiresAuth?: boolean;
    action?: "mundial" | "category" | "provider";
    value?: string;
};

const banners: CarouselBanner[] = [
    {
        id: "mundial-league",
        src: require("../../assets/images/casino/carousel/mundial-league-home-opt.jpeg"),
        requiresAuth: true,
        action: "mundial",
    },
    {
        id: "live-casino",
        src: require("../../assets/images/casino/carousel/casino-live-opt.jpeg"),
        action: "category",
        value: "live games",
    },
    {
        id: "casino-offers",
        src: require("../../assets/images/casino/carousel/casino-offers-opt.jpeg"),
    },
    {
        id: "casino-live",
        src: require("../../assets/images/casino/carousel/live-casino-opt.jpeg"),
        action: "category",
        value: "live games",
    },
    {
        id: "highflyer",
        src: require("../../assets/images/casino/carousel/highflyer-opt.jpeg"),
        action: "provider",
        value: "pragmatic",
    },
    {
        id: "kuku-maziwa",
        src: require("../../assets/images/casino/carousel/kuku_maziwa-opt.jpeg"),
        action: "provider",
        value: "spribe",
    },
];

const CasinoCarousel: React.FC = () => {
    const navigation = useNavigation<any>();
    const [state, dispatch] = useContext(Context);

    const flatListRef = useRef<FlatList<CarouselBanner>>(null);
    const activeIndexRef = useRef(0);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: any[] }) => {
            if (viewableItems.length > 0) {
                activeIndexRef.current = viewableItems[0].index ?? 0;
            }
        }
    ).current;

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndexRef.current + 1) % banners.length;
            activeIndexRef.current = nextIndex;

            flatListRef.current?.scrollToOffset({
                offset: nextIndex * width,
                animated: true,
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const openCasinoProvider = async (providerName: string) => {
        const provider = state?.casinofilters?.providers?.find(
            (item: any) => item?.name?.toLowerCase() === providerName.toLowerCase()
        );

        if (!provider) {
            navigation.navigate("Casino");
            return;
        }

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

    const openCasinoCategory = async (categoryName: string) => {
        const category = state?.casinofilters?.gameTypes?.find(
            (item: any) => item?.name?.toLowerCase() === categoryName.toLowerCase()
        );

        if (!category) {
            navigation.navigate("Casino");
            return;
        }

        const payload = {
            filterType: "category",
            category,
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

    const handleBannerPress = async (banner: CarouselBanner) => {
        if (banner.requiresAuth && !state?.user) {
            dispatch({
                type: "SET",
                key: "showloginmodal",
                payload: true,
            });
            return;
        }

        if (banner.action === "mundial") {
            dispatch({
                type: "SET",
                key: "playType",
                payload: "casino",
            });

            navigation.navigate("Casino", {
                screen: "CasinoLaunchedGameScreen",
                params: {
                    provider: "unicraft",
                    game: "mundial-league",
                },
            });
            return;
        }

        if (banner.action === "provider" && banner.value) {
            await openCasinoProvider(banner.value);
            return;
        }

        if (banner.action === "category" && banner.value) {
            await openCasinoCategory(banner.value);
        }
    };

    const renderItem = ({ item }: ListRenderItemInfo<CarouselBanner>) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleBannerPress(item)}
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

export default React.memo(CasinoCarousel);

const styles = StyleSheet.create({
    image: {
        width: width,
        height: 80,
    },
});
