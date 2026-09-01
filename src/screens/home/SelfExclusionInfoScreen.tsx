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

const SelfExclusionInfoScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const handleNavigateToExclude = () => {
        navigation.navigate("Sports", { screen: "SelfExcludeScreen" });
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Self-Exclusion</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What is Self-Exclusion?</Text>
                    <Text style={styles.sectionText}>
                        Our Self-Exclusion option allows players to temporarily close their accounts for a specified period. This is a powerful tool to help you stay in control of your gambling.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>How It Works</Text>
                    <View style={styles.stepsList}>
                        <View style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>You cannot place bets or play games during the exclusion period.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>You may still log in to withdraw remaining funds (if eligible).</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>The account cannot be reactivated until the exclusion period ends.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>4</Text>
                            </View>
                            <Text style={styles.stepText}>Bonuses may expire during the exclusion period.</Text>
                        </View>
                        <View style={styles.stepItem}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>5</Text>
                            </View>
                            <Text style={styles.stepText}>Creating new accounts during self-exclusion is prohibited.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Activating Self-Exclusion</Text>
                    <Text style={styles.sectionText}>
                        You can activate self-exclusion directly from this app. Identity verification may be required for permanent closure.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Exclusion Periods Available</Text>
                    <View style={styles.optionsList}>
                        <Text style={styles.optionItem}>• 1 month</Text>
                        <Text style={styles.optionItem}>• 3 months</Text>
                        <Text style={styles.optionItem}>• 6 months</Text>
                        <Text style={styles.optionItem}>• 1 year</Text>
                        <Text style={styles.optionItem}>• Indefinitely</Text>
                    </View>
                </View>

                <View style={styles.warningBox}>
                    <Icon name="warning" size={28} color="#f59e0b" />
                    <View style={styles.warningContent}>
                        <Text style={styles.warningTitle}>Important</Text>
                        <Text style={styles.warningText}>
                            Once you activate self-exclusion, you will not be able to reverse this decision during the exclusion period.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNavigateToExclude}
                >
                    <Text style={styles.primaryButtonText}>Activate Self-Exclusion</Text>
                    <Icon name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default SelfExclusionInfoScreen;

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
    stepsList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 8,
    },
    stepItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#a71f66',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
        paddingTop: 6,
    },
    optionsList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
    },
    optionItem: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 24,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    warningContent: {
        flex: 1,
        marginLeft: 12,
    },
    warningTitle: {
        color: '#f59e0b',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    warningText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
    },
    primaryButton: {
        backgroundColor: '#a71f66',
        borderRadius: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
