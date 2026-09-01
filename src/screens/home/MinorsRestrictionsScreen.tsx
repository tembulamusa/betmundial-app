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

const MinorsRestrictionsScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>18+ Protection</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.warningBanner}>
                    <Icon name="gpp-bad" size={40} color="#dc2626" />
                    <Text style={styles.bannerTitle}>Strictly Prohibited for Minors</Text>
                    <Text style={styles.bannerText}>Gambling is strictly prohibited for individuals under the age of 18.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Protection Measures</Text>
                    <Text style={styles.sectionText}>
                        Betmundial takes strong measures to prevent underage gambling and protect minors.
                    </Text>
                </View>

                <View style={styles.measuresGrid}>
                    <View style={styles.measureCard}>
                        <Icon name="verified-user" size={32} color="#a71f66" />
                        <Text style={styles.measureTitle}>Age Verification</Text>
                        <Text style={styles.measureText}>Players must confirm they are 18+ during registration.</Text>
                    </View>

                    <View style={styles.measureCard}>
                        <Icon name="assignment-ind" size={32} color="#a71f66" />
                        <Text style={styles.measureTitle}>Identity Verification</Text>
                        <Text style={styles.measureText}>Personal information is verified during signup.</Text>
                    </View>

                    <View style={styles.measureCard}>
                        <Icon name="phone-android" size={32} color="#a71f66" />
                        <Text style={styles.measureTitle}>M-Pesa Registration</Text>
                        <Text style={styles.measureText}>Mobile money registration requires valid national ID.</Text>
                    </View>

                    <View style={styles.measureCard}>
                        <Icon name="security" size={32} color="#a71f66" />
                        <Text style={styles.measureTitle}>Device Security</Text>
                        <Text style={styles.measureText}>Parents should secure login credentials and shared devices.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Parent/Guardian Responsibilities</Text>
                    <View style={styles.responsibilityList}>
                        <View style={styles.respItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.respText}>Secure login credentials and device access</Text>
                        </View>
                        <View style={styles.respItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.respText}>Monitor device usage and online activity</Text>
                        </View>
                        <View style={styles.respItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.respText}>Educate minors about gambling risks</Text>
                        </View>
                        <View style={styles.respItem}>
                            <Icon name="check-circle" size={20} color="#16a34a" />
                            <Text style={styles.respText}>Use content filtering software on shared devices</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Recommended Filtering Software</Text>
                    <Text style={styles.sectionText}>
                        Parents can use these trusted tools to filter and control content:
                    </Text>
                    <View style={styles.softwareList}>
                        <Text style={styles.softwareItem}>
                            <Text style={styles.bold}>Net Nanny</Text> – www.netnanny.com
                        </Text>
                        <Text style={styles.softwareItem}>
                            <Text style={styles.bold}>CYBERsitter</Text> – www.cybersitter.com
                        </Text>
                        <Text style={styles.softwareItem}>
                            <Text style={styles.bold}>GamBlock</Text> – www.gamblock.com
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Report Underage Activity</Text>
                    <Text style={styles.sectionText}>
                        If you discover an underage person using Betmundial or any gambling platform, please report it immediately to our customer care team or the relevant authorities.
                    </Text>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Underage gambling is a serious issue. Betmundial is committed to strict compliance with all laws protecting minors from gambling harm.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default MinorsRestrictionsScreen;

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
    warningBanner: {
        backgroundColor: 'rgba(220,38,38,0.15)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#dc2626',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 8,
    },
    bannerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 20,
        marginTop: 4,
        textAlign: 'center',
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
    measuresGrid: {
        marginBottom: 24,
    },
    measureCard: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    measureTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
    },
    measureText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        lineHeight: 18,
    },
    responsibilityList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
    },
    respItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    respText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 12,
    },
    softwareList: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    softwareItem: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 24,
    },
    bold: {
        color: '#fff',
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
