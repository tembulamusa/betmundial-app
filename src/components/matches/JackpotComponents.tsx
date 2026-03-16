import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import MatchRow from "./MatchRow"; // Make sure you have a React Native version of this
// import MatchHeaderRow from "./MatchHeaderRow"; // Same as above

interface Match {
    match_id: string | number;
    home_team: string;
    away_team: string;
    odds?: any;
    parent_match_id?: string | number;
    [key: string]: any;
}

interface JackpotMatchListProps {
    matches?: {
        matches: Record<string, Match>;
        status?: string;
    };
}

export const JackpotMatchList: React.FC<JackpotMatchListProps> = ({ matches }) => {
    const matchArray = matches ? Object.entries(matches.matches) : [];

    return (
        <View style={styles.container}>
            {/* {matches && matchArray.length > 0 && (
                <MatchHeaderRow
                    three_way={true}
                    jackpot={true}
                    first_match={matchArray[0][1]}
                />
            )} */}

            <ScrollView style={styles.scrollContainer}>
                {matchArray.length > 0 ? (
                    matchArray.map(([key, match]) => (
                        <MatchRow
                            match={match}
                            jackpot
                            jackpotstatus={matches?.status}
                            key={"jackpot-match-" + key}
                        />
                    ))
                ) : (
                    <Text style={styles.noMatchesText}>No events found.</Text>
                )}
            </ScrollView>
        </View>
    );
};

interface JackpotResultsListProps {
    results?: {
        matches: Match[];
        status?: string;
    };
}

const JackpotResultsHeader: React.FC = () => {
    return (
        <View style={styles.resultsHeader}>
            <View style={styles.columnDate}>
                <Text style={styles.headerText}>Date</Text>
            </View>
            <View style={styles.columnGame}>
                <Text style={styles.headerText}>Game</Text>
            </View>
            <View style={styles.columnResults}>
                <Text style={styles.headerText}>Results</Text>
            </View>
        </View>
    );
};

export const JackpotResultsList: React.FC<JackpotResultsListProps> = ({
    results,
}) => {
    return (
        <View style={styles.container}>
            <JackpotResultsHeader />
            <ScrollView style={styles.scrollContainer}>
                {results && results.matches.length > 0 ? (
                    results.matches.map((match, key) => (
                        <MatchRow
                            initialMatch={match}
                            jackpot
                            jackpotstatus={results?.status}
                            key={key}
                        />
                    ))
                ) : (
                    <Text style={styles.noMatchesText}>No results found.</Text>
                )}
            </ScrollView>
        </View>
    );
};

export const JackpotHeader: React.FC<JackpotResultsListProps> = ({
    results,
}) => {
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                <View><Text style={styles.headerText}>Daily Jackpot</Text></View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        // marginTop: 4,
    },
    scrollContainer: {
        marginTop: 4,
    },
    noMatchesText: {
        textAlign: "center",
        paddingVertical: 16,
        fontSize: 16,
        color: "#fff",
    },
    resultsHeader: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    columnDate: {
        flex: 2,
    },
    columnGame: {
        flex: 5,
    },
    columnResults: {
        flex: 3,
        alignItems: "flex-end",
    },
    headerText: {
        fontWeight: "bold",
        color: "#fff",
    },
});