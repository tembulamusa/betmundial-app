import React, { useState } from 'react';
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

const SelfAssessmentScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [responses, setResponses] = useState<boolean[]>([false, false, false, false, false, false]);

    const questions = [
        "Do you feel depressed after losing money?",
        "Do you try to win back losses immediately?",
        "Have you run out of money due to gambling?",
        "Have you borrowed money to gamble?",
        "Has gambling affected relationships or hobbies?",
        "Have you ever felt hopeless or suicidal due to gambling?",
    ];

    const toggleResponse = (index: number) => {
        const newResponses = [...responses];
        newResponses[index] = !newResponses[index];
        setResponses(newResponses);
    };

    const yesCount = responses.filter(r => r).length;
    const getResult = () => {
        if (yesCount === 0) {
            return {
                level: 'Low Risk',
                color: '#16a34a',
                message: 'You appear to be gambling responsibly. Continue to monitor your behavior.',
            };
        } else if (yesCount <= 2) {
            return {
                level: 'Moderate Risk',
                color: '#f59e0b',
                message: 'You may be showing some signs of problem gambling. Consider seeking help.',
            };
        } else {
            return {
                level: 'High Risk',
                color: '#dc2626',
                message: 'You may have a gambling problem. Please seek professional help immediately.',
            };
        }
    };

    const result = getResult();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Self-Assessment</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assessment Questions</Text>
                    <Text style={styles.sectionText}>
                        Answer the following questions honestly to help determine whether gambling may be becoming a problem for you.
                    </Text>
                </View>

                <View style={styles.questionsContainer}>
                    {questions.map((question, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.questionCard,
                                responses[index] && styles.questionCardSelected,
                            ]}
                            onPress={() => toggleResponse(index)}
                        >
                            <View style={styles.questionHeader}>
                                <View
                                    style={[
                                        styles.checkbox,
                                        responses[index] && styles.checkboxChecked,
                                    ]}
                                >
                                    {responses[index] && (
                                        <Icon name="check" size={16} color="#fff" />
                                    )}
                                </View>
                                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                            </View>
                            <Text style={styles.questionText}>{question}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.resultBox, { borderLeftColor: result.color }]}>
                    <View style={styles.resultHeader}>
                        <Icon name="assessment" size={28} color={result.color} />
                        <Text style={[styles.resultTitle, { color: result.color }]}>
                            {result.level}
                        </Text>
                    </View>
                    <Text style={styles.resultScore}>
                        {yesCount} out of {questions.length} questions answered "Yes"
                    </Text>
                    <Text style={styles.resultMessage}>{result.message}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Important Notes</Text>
                    <Text style={styles.sectionText}>
                        This self-assessment is not a medical diagnosis. If you are concerned about your gambling habits, we strongly recommend seeking professional help from a qualified counselor or therapist.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => navigation.navigate("GettingHelpScreen")}
                >
                    <Icon name="help" size={20} color="#fff" />
                    <Text style={styles.helpButtonText}>Get Help</Text>
                </TouchableOpacity>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        If you answered "Yes" to any questions, especially the last one, please seek immediate assistance from a mental health professional or call our 24/7 support line.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default SelfAssessmentScreen;

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
    questionsContainer: {
        marginBottom: 24,
    },
    questionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: 'rgba(255,255,255,0.2)',
    },
    questionCardSelected: {
        backgroundColor: 'rgba(167,31,102,0.2)',
        borderLeftColor: '#a71f66',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#a71f66',
        borderColor: '#a71f66',
    },
    questionNumber: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    questionText: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 34,
    },
    resultBox: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 10,
    },
    resultScore: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginBottom: 8,
    },
    resultMessage: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16a34a',
        borderRadius: 8,
        paddingVertical: 12,
        marginBottom: 24,
        gap: 10,
    },
    helpButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    disclaimer: {
        backgroundColor: 'rgba(220,38,38,0.15)',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    disclaimerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
    },
});
