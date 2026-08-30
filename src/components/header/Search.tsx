import React, { useContext, useState, useRef, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Context } from "../../context/store";
import { theme } from "../../theme";

interface SearchProps {
    onActiveChange?: (active: boolean) => void;
}

const Search: React.FC<SearchProps> = ({ onActiveChange }) => {
    const [state, dispatch] = useContext(Context);
    const navigation = useNavigation<any>();

    const [searching, setSearching] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    const isCasino = state?.playType === "casino";

    const setActive = useCallback(
        (active: boolean) => {
            setSearching(active);
            onActiveChange?.(active);
        },
        [onActiveChange]
    );

    const updateSearchTerm = useCallback(
        (value: string) => {
            if (value.length >= 3) {
                dispatch({ type: "SET", key: "searchterm", payload: value });
            } else {
                dispatch({ type: "DEL", key: "searchterm" });
            }
        },
        [dispatch]
    );

    const showSearchBar = useCallback(() => {
        setActive(true);
    }, [setActive]);

    const dismissSearch = useCallback(() => {
        setActive(false);
        dispatch({ type: "DEL", key: "searchterm" });
    }, [dispatch, setActive]);

    useEffect(() => {
        if (!searching) return;
        const timer = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, [searching]);

    const goSports = useCallback(() => {
        dismissSearch();
        navigation.navigate("Sports", { screen: "HomeMain" });
        dispatch({ type: "SET", key: "playType", payload: "sports" });
    }, [dismissSearch, navigation, dispatch]);

    const goCasino = useCallback(() => {
        dismissSearch();
        navigation.navigate("Casino", { screen: "CasinoMain" });
        dispatch({ type: "SET", key: "playType", payload: "casino" });
    }, [dismissSearch, navigation, dispatch]);

    if (!searching) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={showSearchBar}
                    activeOpacity={0.85}
                    accessibilityLabel="Open search"
                >
                    <Icon name="search" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.expanded}>
            <View style={styles.inputRow}>
                <Icon name="search" size={13} color="rgba(255,255,255,0.6)" />
                <TextInput
                    ref={searchInputRef}
                    placeholder="Search teams, competitions, or game IDs"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    style={styles.input}
                    value={state?.searchterm || ""}
                    onChangeText={updateSearchTerm}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={dismissSearch} hitSlop={8}>
                    <Icon name="times" size={16} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleBtn, !isCasino && styles.toggleBtnActive]}
                    onPress={goSports}
                >
                    <Text style={[styles.toggleText, !isCasino && styles.toggleTextActive]}>
                        Sports
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, isCasino && styles.toggleBtnActive]}
                    onPress={goCasino}
                >
                    <Text style={[styles.toggleText, isCasino && styles.toggleTextActive]}>
                        Casino
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
    searchBtn: {
        width: 44,
        height: 32,
        borderRadius: 7,
        backgroundColor: "rgba(167, 31, 102, 0.24)",
        borderWidth: 1,
        borderColor: "rgba(167, 31, 102, 0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    expanded: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 10,
        paddingVertical: 7,
        minHeight: 32,
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 13,
        padding: 0,
        minWidth: 0,
    },
    toggleRow: {
        flexDirection: "row",
        gap: 6,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 5,
        alignItems: "center",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    toggleBtnActive: {
        backgroundColor: theme.accent,
        borderColor: theme.accent,
    },
    toggleText: {
        color: "rgba(255,255,255,0.7)",
        fontWeight: "600",
        fontSize: 11,
    },
    toggleTextActive: {
        color: "#fff",
    },
});

export default React.memo(Search);
