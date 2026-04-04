import React, { useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Alert,
    NativeSyntheticEvent,
    NativeScrollEvent,
    ActivityIndicator
} from "react-native";
import MatchRow from "./MatchRow";
import ShimmerLoader from "../common/ShimmerLoader";
import { Context } from "../../context/store";

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

const MatchList: React.FC<Props> = ({ 
    matches, 
    live, 
    ListHeaderComponent,
    onScroll,
    scrollEventThrottle = 16,
    fetching = false
}) => {
    const [state, dispatch] = React.useContext(Context);

    useEffect(() => {
        // Alert.alert("the betslip", JSON.stringify(state?.betslip));
    }, [state?.betslip, state?.jackpotbetslip]);


    const renderItem = ({ item }: { item: Match }) => (
        <MatchRow match={item} live={live} />
    );

    const listFooter = () => {
        // Show shimmer only if fetching and there are no matches yet
        if (fetching && matches.length === 0) {
            return <ShimmerLoader count={5} height={100} marginVertical={8} />;
        }
        return null;
    };

    const listHeader = () => {
        return (
            <>
                {ListHeaderComponent}
                {fetching && matches.length > 0 && (
                    <View style={styles.updatingBar}>
                        <ActivityIndicator size="small" color="#a71f66" />
                        <Text style={styles.updatingText}>Updating matches...</Text>
                    </View>
                )}
            </>
        );
    };

    return (
        <FlatList
            data={matches}
            renderItem={renderItem}
            key={live ? "live-match-list" : "prematch-list"}
            keyExtractor={(item) =>
                `${live ? "live" : "prematch"}-${item.match_id}`
            }
            contentContainerStyle={styles.container}
            ListHeaderComponent={listHeader()}
            ListFooterComponent={listFooter()}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
        />
    );
};

export default React.memo(MatchList);

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
