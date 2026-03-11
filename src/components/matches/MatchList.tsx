import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Alert
} from "react-native";
import MatchRow from "./MatchRow";
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
}

const MatchList: React.FC<Props> = ({ matches, live }) => {
    const [state, dispatch] = React.useContext(Context);

    useEffect(() => {
        Alert.alert("the betslip", JSON.stringify(state?.betslip));
    }, [state?.betslip, state?.jackpotbetslip]);


    const renderItem = ({ item }: { item: Match }) => (
        <MatchRow match={item} live={live} />
    );

    return (
        <FlatList
            data={matches}
            renderItem={renderItem}
            keyExtractor={(item) => item.match_id}
            contentContainerStyle={styles.container}
        />
    );
};

export default React.memo(MatchList);

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20
    }
});