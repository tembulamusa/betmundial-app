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

const SupportForFriendsScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support for Friends & Family</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How Gambling Problems Affect Loved Ones</Text>
                    <Text style={styles.sectionText}>
                        Gambling problems can have serious consequences not only for the individual but also for their friends and family members. If you are concerned about someone's gambling habits, here's how you can help.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Common Impacts on Family & Friends</Text>
                    <View style={styles.impactsList}>
                        <View style={styles.impactItem}>
                            <Icon name="warning" size={20} color="#f59e0b" />
                            <Text style={styles.impactText}>Financial stress and debt</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Icon name="warning" size={20} color="#f59e0b" />
                            <Text style={styles.impactText}>Relationship breakdown</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Icon name="warning" size={20} color="#f59e0b" />
                            <Text style={styles.impactText}>Emotional stress and anxiety</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Icon name="warning" size={20} color="#f59e0b" />
                            <Text style={styles.impactText}>Child neglect or behavioral issues</Text>
                        </View>
                        <View style={styles.impactItem}>
                            <Icon name="warning" size={20} color="#f59e0b" />
                            <Text style={styles.impactText}>Trust and communication problems</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>How to Help</Text>
                    <View style={styles.tipsList}>
                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>1. Start a Conversation</Text>
                            <Text style={styles.tipText}>
                                Choose a calm moment and express your concerns in a non-judgmental way. Use "I" statements like "I'm concerned..." instead of accusations.
                            </Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>2. Listen Without Judgment</Text>
                            <Text style={styles.tipText}>
                                Allow them to share their feelings and experiences. Show empathy and avoid criticizing or shaming them.
                            </Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>3. Suggest Professional Help</Text>
                            <Text style={styles.tipText}>
                                Encourage them to seek help from a qualified counselor, therapist, or support group dedicated to gambling addiction.
                            </Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>4. Provide Resources</Text>
                            <Text style={styles.tipText}>
                                Share contact information for support services like GamHelp Kenya or other professional resources they can access.
                            </Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>5. Set Boundaries</Text>
                            <Text style={styles.tipText}>
                                While being supportive, establish healthy boundaries to protect your own wellbeing. Don't enable the behavior by lending money or covering debts.
                            </Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipTitle}>6. Take Care of Yourself</Text>
                            <Text style={styles.tipText}>
                                Supporting someone with a gambling problem can be emotionally draining. Seek support for yourself when needed.
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>What NOT to Do</Text>
                    <View style={styles.dontList}>
                        <Text style={styles.dontItem}>✗ Don't blame or shame them</Text>
                        <Text style={styles.dontItem}>✗ Don't lend them money to gamble or cover losses</Text>
                        <Text style={styles.dontItem}>✗ Don't ignore the problem hoping it goes away</Text>
                        <Text style={styles.dontItem}>✗ Don't make threats unless you're prepared to follow through</Text>
                        <Text style={styles.dontItem}>✗ Don't try to control their gambling directly</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Resources for You</Text>
                    <Text style={styles.sectionText}>
                        There are support groups and resources specifically designed for families and friends of people with gambling problems:
                    </Text>
                    <View style={styles.resourceList}>
                        <Text style={styles.resourceItem}>
                            • Gamblers Anonymous (GA) - Support and recovery programs
                        </Text>
                        <Text style={styles.resourceItem}>
                            • Gam-Anon - For families and friends of compulsive gamblers
                        </Text>
                        <Text style={styles.resourceItem}>
                            • Individual counseling for yourself
                        </Text>
                        <Text style={styles.resourceItem}>
                            • Family therapy to address relationship issues
                        </Text>
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Remember: You can support them, but ultimately they must make the decision to seek help. Focus on what you can control and take care of your own mental health.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default SupportForFriendsScreen;

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
        backgroundColor: 'rgba(255,255,255,0.08)',
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
    impactsList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
    },
    impactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    impactText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginLeft: 12,
    },
    tipsList: {
        marginBottom: 12,
    },
    tipCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    tipTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },
    tipText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
    },
    dontList: {
        backgroundColor: 'rgba(220,38,38,0.1)',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    dontItem: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 24,
    },
    resourceList: {
        marginTop: 12,
        marginLeft: 8,
    },
    resourceItem: {
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
