import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Header } from '@react-navigation/stack'; // For React Navigation integration
import Icon from 'react-native-vector-icons/FontAwesome'; // For the bell icon
import { AuthContext } from '../AuthContext';
import { useSync } from '../context/SyncContext';
import { syncWithConfirmation } from '../services/offlineSync';
import { getUnsyncedCollections } from '../services/offlineDatabase';
import HeaderLogin from './header/HeaderLogin';
import Search from './header/Search';
import { theme } from '../theme';

const CustomHeader = ({ scene, previous, navigation }) => {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const { logout } = useContext(AuthContext);
    const { isSyncing, lastSyncResult, lastSyncTime, syncError, triggerSync } = useSync();
    const [hasPendingSync, setHasPendingSync] = useState(false);
    const bellIconRef = useRef(null);

    const handleLogout = async () => {
        console.log('Logout button pressed, closing dropdown...');
        setDropdownVisible(false);
        console.log('Calling logout function...');
        await logout();
        console.log('Logout function completed');
    };

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    // Check for pending syncs on component mount
    useEffect(() => {
        const checkPendingSyncs = async () => {
            try {
                const pendingCollections = await getUnsyncedCollections();
                setHasPendingSync(pendingCollections.length > 0);
            } catch (error) {
                console.error('Error checking pending syncs:', error);
            }
        };

        checkPendingSyncs();

        // Re-check when sync completes
        if (!isSyncing && hasPendingSync) {
            checkPendingSyncs();
        }
    }, [isSyncing, hasPendingSync]);

    const handleSyncPress = async () => {
        try {
            console.log('[SYNC] Sync button pressed, checking for pending collections...');
            // Check if there are pending syncs
            const pendingCollections = await getUnsyncedCollections();
            console.log('[SYNC] Found pending collections:', pendingCollections.length);
            if (pendingCollections.length > 0) {
                // If there are pending syncs, automatically start sync
                console.log('[SYNC] Starting sync process...');
                const result = await triggerSync();

                // Show result
                if (result.success > 0 && result.failed === 0) {
                    Alert.alert('Sync Complete', `Successfully synced ${result.success} collection(s).`);
                } else if (result.failed > 0) {
                    Alert.alert('Sync Partially Failed', `Successfully synced ${result.success} collection(s), but ${result.failed} failed.`);
                }
            } else {
                // No pending syncs - show success message
                Alert.alert('All Synced', 'All your offline collections are already synced.');
            }
        } catch (error) {
            console.error('Error during sync:', error);
            Alert.alert('Sync Error', 'An error occurred during sync. Please try again.');
        }
    };


    return (
        <View style={styles.header}>
            <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
            />

            <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Search />
                <HeaderLogin />
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.background,
        paddingHorizontal: 10,
        paddingVertical: 20,
        // height: 60, // Adjust height as needed
    },
    logo: {
        width: 120,
        height: 60,
        // borderRadius: 20, // Circular image
        // marginRight: 10,
    },
    headerText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    iconContainer: {
        position: 'relative',
        padding: 8,
    },
    iconContainerDisabled: {
        opacity: 0.6,
    },
    badge: {
        position: 'absolute',
        right: 2,
        top: 5,
        backgroundColor: '#F44336', // Red badge
        borderRadius: 6,
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    syncBadge: {
        position: 'absolute',
        right: 2,
        top: 5,
        backgroundColor: '#4CAF50', // Green for success
        borderRadius: 6,
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    syncBadgeError: {
        backgroundColor: '#F44336', // Red for errors/failures
    },
    syncBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    pendingSyncBadge: {
        position: 'absolute',
        right: 2,
        top: 5,
        backgroundColor: '#EF4444', // Red for pending sync
        borderRadius: 6,
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pendingSyncBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 70,
        paddingRight: 10,
    },
    dropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: 320,
        maxHeight: 500,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    notificationsList: {
        maxHeight: 350,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    emptyNotifications: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F44336',
        marginLeft: 8,
    },
});

export default CustomHeader;