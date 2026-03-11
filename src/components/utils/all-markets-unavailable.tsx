import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

import Logo from "../../assets/img/logoFav.png"; // Ensure this is RN compatible
import Carousel from "../carousel/Carousel";
import NoEvents from "./no-events";

interface Props {
    backLink?: string;
    isLoading?: boolean;
}

const AllMarketsUnavailable: React.FC<Props> = ({ backLink, isLoading }) => {
    const navigation = useNavigation<any>();

    const handleGoBack = () => {
        if (backLink) {
            navigation.navigate(backLink);
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            {/* Logo / Loader */}
            {/* <Carousel isLoading={isLoading} logo={<Image source={Logo} style={{ width: 80, height: 80 }} />} /> */}
            <View style={styles.messageContainer}>
                <NoEvents message="Event Not Found" />

                {/* Optional Back Button */}
                {backLink && (
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default React.memo(AllMarketsUnavailable);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: "#111" },
    messageContainer: { marginTop: 16, alignItems: "center" },
    backButton: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: "#ffcc00",
        borderRadius: 8,
    },
    backButtonText: {
        color: "#111",
        fontWeight: "700",
        fontSize: 14,
    },
});