import React, { useRef, useState, useEffect } from "react";
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

const { width } = Dimensions.get("window");

type CarouselImage = {
    id: string;
    src: any;
};

const images: CarouselImage[] = [
    { id: "1", src: require("../../assets/images/banners/carousel/Karibu-Bonus.jpeg") },
    { id: "2", src: require("../../assets/images/banners/carousel/Deposit-Bonus.jpeg") },
    { id: "3", src: require("../../assets/images/banners/carousel/fazi1.png") },
    { id: "4", src: require("../../assets/images/banners/carousel/aviator.jpeg") },
    { id: "5", src: require("../../assets/images/banners/carousel/fazi2.png") },
];

const CarouselLoader: React.FC = () => {
    const navigation = useNavigation();

    const flatListRef = useRef<FlatList<CarouselImage>>(null);
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
            const nextIndex = (activeIndex + 1) % images.length;

            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });

            setActiveIndex(nextIndex);
        }, 4000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    const renderItem = ({ item }: ListRenderItemInfo<CarouselImage>) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
                // navigation.navigate("Casino" as never);
            }}
        >
            <Image source={item.src} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
    );

    return (
        <View>
            <FlatList
                ref={flatListRef}
                data={images}
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