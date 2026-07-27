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

const LicensingScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Licensing</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* CONTENT */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>AIB Petals Limited License Information</Text>
                    <Text style={styles.sectionText}>
                        AIB Petals Limited is licensed by the Gambling Regulatory Authority of Kenya (GRAK - formerly BCLB) under the Betting, Lotteries and Gaming Act, 1966 (now repealed by the Gambling Control Act, 2025) and any regulations made thereunder.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>License Numbers:</Text>
                    <View style={styles.licenseBox}>
                        <Text style={styles.licenseText}>
                            <Text style={styles.licenseLabel}>Book Maker's License:</Text> 0001303
                        </Text>
                        <Text style={styles.licenseText}>
                            <Text style={styles.licenseLabel}>Public Gaming License:</Text> 0001211
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Regulatory Authority</Text>
                    <Text style={styles.sectionText}>
                        <Text style={styles.bold}>Gambling Regulatory Authority of Kenya (GRAK)</Text>
                        {'\n'}
                        Formerly known as BCLB (Betting Control and Licensing Board)
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionSubtitle}>Legal Framework</Text>
                    <Text style={styles.sectionText}>
                        All operations comply with:
                    </Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Betting, Lotteries and Gaming Act, 1966</Text>
                        <Text style={styles.bulletItem}>• Gambling Control Act, 2025</Text>
                        <Text style={styles.bulletItem}>• All applicable regulations and amendments</Text>
                    </View>
                </View>

                <View style={styles.disclaimer}>
                    <Text style={styles.disclaimerText}>
                        Betmundial operates under these licenses and is committed to responsible gaming practices and regulatory compliance.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default LicensingScreen;

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
        marginBottom: 8,
    },
    sectionText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
    },
    licenseBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#a71f66',
    },
    licenseText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 8,
    },
    licenseLabel: {
        color: '#fff',
        fontWeight: '600',
    },
    bold: {
        color: '#fff',
        fontWeight: '700',
    },
    bulletList: {
        marginTop: 8,
        marginLeft: 8,
    },
    bulletItem: {
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
