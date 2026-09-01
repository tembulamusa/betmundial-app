import React, { useCallback, useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ActivityIndicator
} from "react-native";
import MatchRow from "./MatchRow";
import ShimmerLoader from "../common/ShimmerLoader";

interface Match {
    match_id: string;
    home_team: string;
    away_team: string;
    score?: string;
    match_time?: string;
    odds?: any;
}

interface Props {
    matches: Match[];
    live?: boolean;
    ListHeaderComponent?: React.ReactElement | null;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    scrollEventThrottle?: number;
    fetching?: boolean;
}

/* ================= MEMOIZED ROW ================= */
const MemoMatchRow = React.memo(
    ({ item, live }: { item: Match; live?: boolean }) => {
        return <MatchRow match={item} live={live} />;
    }
);

const MatchList: React.FC<Props> = ({
    matches,
    live,
    ListHeaderComponent,
    onScroll,
    scrollEventThrottle = 16,
    fetching = false
}) => {
    /* ================= RENDER ITEM ================= */
    const renderItem = useCallback(
        ({ item }: { item: Match }) => {
            return <MemoMatchRow item={item} live={live} />;
        },
        [live]
    );

    /* ================= KEY EXTRACTOR ================= */
    const keyExtractor = useCallback(
        (item: Match) => `${item?.match_id}`,
        []
    );

    /* ================= HEADER ================= */
    const listHeader = useMemo(() => {
        return (
            <>
                {ListHeaderComponent}

                {fetching && matches.length > 0 && (
                    <View style={styles.updatingBar}>
                        <ActivityIndicator size="small" color="#a71f66" />
                        <Text style={styles.updatingText}>
                            Updating matches...
                        </Text>
                    </View>
                )}
            </>
        );
    }, [ListHeaderComponent, fetching, matches.length]);

    /* ================= FOOTER ================= */
    const listFooter = useMemo(() => {
        if (fetching && matches.length === 0) {
            return (
                <ShimmerLoader
                    count={5}
                    height={100}
                    marginVertical={8}
                />
            );
        }
        return null;
    }, [fetching, matches.length]);

    /* ================= OPTIMIZATION CONFIG ================= */
    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: 100, // approximate row height (IMPORTANT)
            offset: 100 * index,
            index,
        }),
        []
    );

    return (
        <FlatList
            data={matches}
            renderItem={renderItem}
            keyExtractor={keyExtractor}

            /* ================= PERFORMANCE BOOST ================= */
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}

            /* ⚡ BIG ONE: prevents re-render storm */
            extraData={null}

            /* OPTIONAL: if row height is stable */
            getItemLayout={getItemLayout}

            /* ================= UI ================= */
            contentContainerStyle={styles.container}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}

            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}

            /* Smooth scrolling */
            showsVerticalScrollIndicator={false}
        />
    );
};

export default React.memo(MatchList);

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        paddingBottom: 20
    },

    updatingBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        marginBottom: 8,
        backgroundColor: "rgba(167, 31, 102, 0.1)",
        borderRadius: 8,
        marginHorizontal: 12,
        gap: 8
    },

    updatingText: {
        color: "#a71f66",
        fontSize: 13,
        fontWeight: "500"
    }
});