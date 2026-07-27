import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';

const GettingHelpScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const handleOpenLink = (url: string) => {
        Linking.openURL(url).catch(err => console.log('Error opening link:', err));
    };

    const handleCallPhone = (phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(err => console.log('Error making call:', err));
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Getting Help</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>24/7 Counselling Support</Text>
                    <Text style={styles.sectionText}>
                        If you or someone you know may have a gambling problem, we strongly recommend seeking professional assistance.
                    </Text>
                </View>

                <View style={styles.supportCard}>
                    <View style={styles.cardHeader}>
                        <Icon name="phone" size={24} color="#a71f66" />
                        <Text style={styles.cardTitle}>GamHelp Kenya</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => handleOpenLink('https://gamhelpkenya.com/')}
                    >
                        <Text style={styles.linkText}>Visit: gamhelpkenya.com</Text>
                        <Icon name="open-in-new" size={18} color="#0ea5e9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.phoneButton}
                        onPress={() => handleCallPhone('+254116444142')}
                    >
                        <Icon name="phone" size={20} color="#fff" />
                        <Text style={styles.phoneText}>+254 0116 444 142</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Warning Signs of Problem Gambling</Text>
                    <View style={styles.warningList}>
                        <Text style={styles.warningItem}>• Uncontrolled spending</Text>
                        <Text style={styles.warningItem}>• Lying about gambling behavior</Text>
                        <Text style={styles.warningItem}>• Borrowing money or stealing to gamble</Text>
                        <Text style={styles.warningItem}>• Loss of interest in hobbies</Text>
                        <Text style={styles.warningItem}>• Neglecting work or studies</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Getting Support From Friends & Family</Text>
                    <Text style={styles.sectionText}>
                        Gambling problems can also affect loved ones. If you are concerned about someone:
                    </Text>
                    <View style={styles.tipsList}>
                        <Text style={styles.tipsItem}>• Encourage open and non-judgmental discussion</Text>
                        <Text style={styles.tipsItem}>• Suggest professional help and support services</Text>
                        <Text style={styles.tipsItem}>• Help them find resources and contact information</Text>
                        <Text style={styles.tipsItem}>• Be patient and supportive throughout their journey</Text>
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Help is available 24/7. Don't hesitate to reach out if you or someone you know needs assistance.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default GettingHelpScreen;

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
    supportCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(14,165,233,0.15)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    linkText: {
        color: '#0ea5e9',
        fontSize: 14,
        fontWeight: '600',
    },
    phoneButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#a71f66',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    phoneText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 10,
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
    tipsList: {
        marginTop: 12,
        marginLeft: 8,
    },
    tipsItem: {
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
