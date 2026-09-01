import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

const ResponsibleGamblingScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Responsible Gaming</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stay in Control – It's Only a Game</Text>
                    <Text style={styles.sectionText}>
                        Betmundial is committed to Responsible Gaming. We aim to ensure that gaming remains an enjoyable leisure activity. While most players participate responsibly, gambling can become problematic for some individuals.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Tips to Stay in Control</Text>
                    <View style={styles.tipsContainer}>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>1</Text>
                            <Text style={styles.tipText}>Only bet amounts you can afford to lose.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>2</Text>
                            <Text style={styles.tipText}>Gambling should be for entertainment, not a way to make money.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>3</Text>
                            <Text style={styles.tipText}>Never chase your losses.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>4</Text>
                            <Text style={styles.tipText}>Keep track of the time and money you spend.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>5</Text>
                            <Text style={styles.tipText}>Balance gambling with other hobbies and activities.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>6</Text>
                            <Text style={styles.tipText}>Take regular breaks and use self-exclusion tools if necessary.</Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Text style={styles.tipNumber}>7</Text>
                            <Text style={styles.tipText}>Avoid gambling when upset, stressed, or under the influence of alcohol.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Warning Signs of Problem Gambling</Text>
                    <Text style={styles.sectionText}>
                        If you notice any of these signs, we encourage you to seek help:
                    </Text>
                    <View style={styles.warningList}>
                        <Text style={styles.warningItem}>• Uncontrolled spending</Text>
                        <Text style={styles.warningItem}>• Lying about gambling behavior</Text>
                        <Text style={styles.warningItem}>• Borrowing money or stealing to gamble</Text>
                        <Text style={styles.warningItem}>• Loss of interest in hobbies</Text>
                        <Text style={styles.warningItem}>• Neglecting work or studies</Text>
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Remember: Gambling should only be for entertainment. If you feel that your gambling is becoming a problem, please seek professional help immediately.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default ResponsibleGamblingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: theme.pageHeaderBackground,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionSubtitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
    },
    tipsContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 8,
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    tipNumber: {
        color: '#a71f66',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        minWidth: 24,
    },
    tipText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
    },
    warningList: {
        marginTop: 12,
        marginLeft: 8,
    },
    warningItem: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 24,
    },
    disclaimer: {
        backgroundColor: 'rgba(167,31,102,0.15)',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    disclaimerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
    },
});
