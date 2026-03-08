import React, { useContext, useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Context } from "../../context/store";

const Search = () => {
    const [, dispatch] = useContext(Context);
    const navigation = useNavigation();
    const route = useRoute();

    const [searching, setSearching] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    const isCasino =
        route.name === "Casino" ||
        (typeof route.name === "string" && route.name.startsWith("Casino"));

    const updateSearchTerm = (value: string) => {
        if (value.length >= 3) {
            dispatch({ type: "SET", key: "searchterm", payload: value });
        } else {
            dispatch({ type: "DEL", key: "searchterm" });
        }
    };

    const showSearchBar = () => {
        setSearching(true);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 150);
    };

    const dismissSearch = () => {
        setSearching(false);
        dispatch({ type: "DEL", key: "searchterm" });
    };

    return (
        <View style={styles.container}>
            {!searching && (
                <TouchableOpacity style={styles.searchBtn} onPress={showSearchBar}>
                    <Icon name="search" size={18} color="#fff" />
                    {/* <Text style={styles.searchLabel}> Search</Text> */}
                </TouchableOpacity>
            )}

            <Modal visible={searching} animationType="fade" transparent>
                <View style={styles.overlay}>
                    <Pressable style={styles.overlayBackground} onPress={dismissSearch} />

                    <View style={styles.searchBox}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={searchInputRef}
                                placeholder="Start typing to search..."
                                placeholderTextColor="#aaa"
                                style={styles.input}
                                onChangeText={updateSearchTerm}
                            />

                            <TouchableOpacity onPress={dismissSearch}>
                                <Icon name="times" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.links}>
                            <TouchableOpacity
                                style={[
                                    styles.linkBtn,
                                    !isCasino && styles.activeLink,
                                ]}
                                onPress={() => {
                                    dismissSearch();
                                    navigation.navigate("Home" as never);
                                }}
                            >
                                <Text style={styles.linkText}>Sports</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.linkBtn,
                                    isCasino && styles.activeLink,
                                ]}
                                onPress={() => {
                                    dismissSearch();
                                    navigation.navigate("Casino" as never);
                                }}
                            >
                                <Text style={styles.linkText}>Casino</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
    },

    searchBtn: {
        flexDirection: "row",
        alignItems: "center",
    },

    searchLabel: {
        color: "#fff",
        fontWeight: "600",
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
    },

    searchBox: {
        backgroundColor: "#1e1e1e",
        borderRadius: 10,
        padding: 16,
    },

    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#444",
        marginBottom: 20,
    },

    input: {
        flex: 1,
        color: "#fff",
        fontSize: 16,
        paddingVertical: 8,
    },

    links: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    linkBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 6,
    },

    activeLink: {
        backgroundColor: "#a71f66",
    },

    linkText: {
        color: "#fff",
        fontWeight: "600",
    },
});

export default React.memo(Search);