// src/services/offlineSync.ts
import NetInfo from '@react-native-community/netinfo';

// Check if online
export const checkConnectivity = async (): Promise<boolean> => {
    try {
        const state = await NetInfo.fetch();
        return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
        console.error('[SYNC] Error checking connectivity:', error);
        return false;
    }
};

// Legacy stub kept for SyncContext compatibility. The offline-collection
// sync feature (milk/produce collection sync) has been removed from this
// app; there is nothing left to sync, so this always reports a no-op
// success so existing callers (useSync/triggerSync) keep working.
export const syncAllCollections = async (
    onSyncStart?: () => void,
    onSyncComplete?: (result: { success: number; failed: number }) => void,
    onSyncError?: (error: string) => void,
    _forceLogin: boolean = true
): Promise<{ success: number; failed: number }> => {
    try {
        if (onSyncStart) onSyncStart();
        const result = { success: 0, failed: 0 };
        if (onSyncComplete) onSyncComplete(result);
        return result;
    } catch (error: any) {
        console.error('[SYNC] Error in sync process:', error);
        if (onSyncError) onSyncError(error?.message || 'Sync failed');
        return { success: 0, failed: 0 };
    }
};
