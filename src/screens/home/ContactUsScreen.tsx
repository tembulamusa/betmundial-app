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

const ContactUsScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const handleEmailContact = () => {
        Linking.openURL('mailto:support@Betmundial.com').catch(err =>
            console.log('Error opening email:', err)
        );
    };

    const handleLiveChat = () => {
        // Placeholder - integrate with your live chat service
        alert('Live Chat feature will open shortly. Coming soon!');
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Us</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Get in Touch With Our Team</Text>
                    <Text style={styles.sectionText}>
                        Our customer care team is here to help. Choose your preferred method of contact and we'll be happy to assist you.
                    </Text>
                </View>

                {/* LIVE CHAT */}
                <TouchableOpacity style={styles.contactCard} onPress={handleLiveChat}>
                    <View style={styles.iconContainer}>
                        <Icon name="chat" size={32} color="#fff" />
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactMethod}>Live Chat</Text>
                        <Text style={styles.contactDetails}>Chat with us instantly</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                {/* EMAIL */}
                <TouchableOpacity style={styles.contactCard} onPress={handleEmailContact}>
                    <View style={styles.iconContainer}>
                        <Icon name="email" size={32} color="#fff" />
                    </View>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactMethod}>Email Us</Text>
                        <Text style={styles.contactDetails}>support@Betmundial.com</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Response Time</Text>
                    <Text style={styles.sectionText}>
                        We strive to respond to all inquiries as quickly as possible. Our support team typically responds within 2-4 hours during business hours.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Available Support</Text>
                    <View style={styles.supportList}>
                        <View style={styles.supportItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.supportText}>Account & Login Issues</Text>
                        </View>
                        <View style={styles.supportItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.supportText}>Deposits & Withdrawals</Text>
                        </View>
                        <View style={styles.supportItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.supportText}>Technical Problems</Text>
                        </View>
                        <View style={styles.supportItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.supportText}>Bonuses & Promotions</Text>
                        </View>
                        <View style={styles.supportItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.supportText}>General Inquiries</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        For urgent issues, please reach out via live chat for the fastest response.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default ContactUsScreen;

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
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: 'rgba(167,31,102,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactMethod: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    contactDetails: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    supportList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
    },
    supportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    supportText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginLeft: 12,
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
