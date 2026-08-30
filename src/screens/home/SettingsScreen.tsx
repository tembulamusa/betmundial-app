import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore - library lacks TypeScript declarations in current setup
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { clearCommonDataCache } from "../../components/utils/fetchCommonData";
import { theme } from "../../theme";

type PreferenceKey =
    | "notifications_enabled"
    | "biometrics_enabled"
    | "dark_mode_enabled";

const preferenceDefaults: Record<PreferenceKey, boolean> = {
    notifications_enabled: true,
    biometrics_enabled: false,
    dark_mode_enabled: false,
};

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<Record<PreferenceKey, boolean>>(preferenceDefaults);

    // Server configuration states
    const [serverDomain, setServerDomain] = useState<string>("");
    const [serverConfigSaving, setServerConfigSaving] = useState(false);

    // Data clearing states
    const [clearingData, setClearingData] = useState(false);

    const preferenceStorageKey = "@betmundialApp:user_preferences";
    const serverConfigStorageKey = "@betmundialApp:server_config";

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem("user");
            let userData = null;
            if (storedUser) {
                userData = JSON.parse(storedUser);
                setUser(userData);
            } else {
                setUser(null);
            }

            const storedPrefs = await AsyncStorage.getItem(preferenceStorageKey);
            if (storedPrefs) {
                const parsed = JSON.parse(storedPrefs);
                setPreferences({
                    ...preferenceDefaults,
                    ...parsed,
                });
            } else {
                setPreferences(preferenceDefaults);
            }

            // Load server configuration
            const storedServerConfig = await AsyncStorage.getItem(serverConfigStorageKey);
            if (storedServerConfig) {
                const serverConfig = JSON.parse(storedServerConfig);
                setServerDomain(serverConfig.domain || "");
            }
        } catch (error) {
            console.error("[Settings] Failed to load settings", error);
            Alert.alert("Error", "Failed to load settings.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleToggle = async (key: PreferenceKey, value: boolean) => {
        try {
            setSaving(true);
            const nextPrefs = { ...preferences, [key]: value };
            setPreferences(nextPrefs);
            await AsyncStorage.setItem(preferenceStorageKey, JSON.stringify(nextPrefs));
        } catch (error) {
            Alert.alert("Error", "Failed to save preference. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            // Clear session data but preserve offline credentials
            await AsyncStorage.multiRemove([
                "user",
                "token",
                "@betmundialApp:user_phone_number"
            ]);

            Alert.alert("Signed Out", "You have been signed out. Your offline login credentials are preserved.");
            navigation.navigate("Auth" as never);
        } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
        }
    };

    const handleChangePassword = () => {
        Alert.alert("Change Password", "Password change functionality will be available soon.");
    };

    const handleUpdateProfile = () => {
        navigation.navigate("Profile" as never);
    };

    const handleSaveServerConfig = async () => {
        if (!serverDomain.trim()) {
            Alert.alert("Error", "Please enter a valid domain or IP address.");
            return;
        }

        try {
            setServerConfigSaving(true);

            // Validate the domain format (basic validation)
            let domainToSave = serverDomain.trim();
            if (!domainToSave.startsWith('http://') && !domainToSave.startsWith('https://')) {
                domainToSave = `http://${domainToSave}`;
            }

            // Remove trailing slash if present
            domainToSave = domainToSave.replace(/\/$/, '');

            // Basic URL validation
            try {
                new URL(domainToSave);
            } catch {
                Alert.alert("Error", "Please enter a valid domain or IP address (e.g., example.com or 192.168.1.100).");
                return;
            }

            const serverConfig = { domain: domainToSave };
            await AsyncStorage.setItem(serverConfigStorageKey, JSON.stringify(serverConfig));

            Alert.alert(
                "Server Configuration Saved",
                `Server URL updated to: ${domainToSave}\n\nYou may need to restart the app for changes to take effect.`,
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error("[Settings] Error saving server config:", error);
            Alert.alert("Error", "Failed to save server configuration.");
        } finally {
            setServerConfigSaving(false);
        }
    };

    const handleClearData = async () => {
        Alert.alert(
            "Clear Cached Data",
            "This will clear all cached data (routes, centers, etc.) from your device. Fresh data will be downloaded next time you access these features.\n\nThis action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear Data",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setClearingData(true);
                            await clearCommonDataCache();
                            Alert.alert(
                                "Data Cleared",
                                "All cached data has been successfully cleared. The app will download fresh data as needed.",
                                [{ text: "OK" }]
                            );
                        } catch (error) {
                            console.error("[Settings] Error clearing data:", error);
                            Alert.alert("Error", "Failed to clear cached data. Please try again.");
                        } finally {
                            setClearingData(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerCard}>
                <Icon name="settings" size={32} color="#047857" />
                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                    {user?.member_details?.full_name ||
                        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                        user?.username ||
                        "Settings"}
                </Text>
                <Text style={styles.headerSubtitle}>
                    Manage your profile, preferences, and app experience.
                </Text>

            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <View style={styles.accountRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.accountName}>
                                {user?.member_details?.full_name ||
                                    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                                    user?.username ||
                                    "Member"}
                            </Text>
                            <Text style={styles.accountEmail}>
                                {user?.email || user?.member_details?.primary_phone || "Email not provided"}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.outlineButton} onPress={handleUpdateProfile}>
                            <Text style={styles.outlineButtonText}>View Profile</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.listRow} onPress={handleChangePassword}>
                        <Icon name="lock" size={20} color="#64748b" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.listTitle}>Change Password</Text>
                            <Text style={styles.listSubtitle}>Update your password periodically for security.</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#cbd5f5" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🌐 Server Configuration</Text>
                <View style={styles.card}>
                    <View style={{ marginBottom: 16 }}>
                        <Text style={styles.listTitle}>Server Domain/IP Address</Text>
                        <Text style={styles.listSubtitle}>
                            Enter your server domain or IP address (without "/api"). This will be used for all API requests.
                        </Text>
                        <TextInput
                            style={styles.serverInput}
                            value={serverDomain}
                            onChangeText={setServerDomain}
                            placeholder="e.g., example.com or 192.168.1.100:8000"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                            Current: {serverDomain || "Using default server"}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveServerButton, serverConfigSaving && { opacity: 0.6 }]}
                        onPress={handleSaveServerConfig}
                        disabled={serverConfigSaving}
                    >
                        {serverConfigSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Icon name="save" size={18} color="#fff" />
                        )}
                        <Text style={styles.saveServerButtonText}>
                            {serverConfigSaving ? "Saving..." : "Save Server Config"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <View style={styles.card}>
                    <View style={styles.preferenceRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listTitle}>Notifications</Text>
                            <Text style={styles.listSubtitle}>Receive updates about cashouts and deliveries.</Text>
                        </View>
                        <Switch
                            value={Boolean(preferences.notifications_enabled)}
                            onValueChange={(val) => handleToggle("notifications_enabled", val)}
                        />
                    </View>
                    <View style={styles.preferenceRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listTitle}>Use Biometrics</Text>
                            <Text style={styles.listSubtitle}>Enable biometric authentication at login.</Text>
                        </View>
                        <Switch
                            value={Boolean(preferences.biometrics_enabled)}
                            onValueChange={(val) => handleToggle("biometrics_enabled", val)}
                        />
                    </View>
                    <View style={styles.preferenceRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.listTitle}>Dark Mode</Text>
                            <Text style={styles.listSubtitle}>Reduce eye strain by enabling dark theme.</Text>
                        </View>
                        <Switch
                            value={Boolean(preferences.dark_mode_enabled)}
                            onValueChange={(val) => handleToggle("dark_mode_enabled", val)}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.listRow}
                        onPress={() => Alert.alert("Support", "Call support at +254 700 000 000.")}
                    >
                        <Icon name="support-agent" size={20} color="#64748b" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.listTitle}>Contact Support</Text>
                            <Text style={styles.listSubtitle}>Reach out for help with your account or devices.</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#cbd5f5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.listRow}
                        onPress={() => Alert.alert("About", "betMundial App v1.0.")}
                    >
                        <Icon name="info" size={20} color="#64748b" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.listTitle}>About betMundial</Text>
                            <Text style={styles.listSubtitle}>Learn more about this application.</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#cbd5f5" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.listRow, clearingData && { opacity: 0.6 }]}
                        onPress={handleClearData}
                        disabled={clearingData}
                    >
                        {clearingData ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                            <Icon name="delete-sweep" size={20} color="#dc2626" />
                        )}
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.listTitle, { color: '#dc2626' }]}>Clear Cached Data</Text>
                            <Text style={styles.listSubtitle}>Remove all cached data to ensure fresh information.</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#cbd5f5" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.signOutButton, saving && { opacity: 0.6 }]}
                onPress={handleSignOut}
                disabled={saving}
            >
                <Icon name="logout" size={20} color="#fff" />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default SettingsScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    contentContainer: { padding: 16, paddingBottom: 48 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background },
    loadingText: { marginTop: 12, color: "#475569", fontSize: 14 },
    headerCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 1,
        gap: 6,
    },
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
    headerSubtitle: { color: "#475569", fontSize: 13 },
    headerSlogan: { color: "#26A69A", fontSize: 12, fontStyle: "italic", marginTop: 2 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        elevation: 1,
        gap: 12,
    },
    accountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    accountName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
    accountEmail: { fontSize: 13, color: "#64748b", marginTop: 2 },
    outlineButton: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#94a3b8",
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    outlineButtonText: { color: "#1e293b", fontWeight: "600" },
    listRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    listTitle: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
    listSubtitle: { fontSize: 12, color: "#64748b" },
    preferenceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    serverInput: {
        borderWidth: 2,
        borderColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8fafc',
        marginTop: 8,
        color: '#0f172a',
    },
    saveServerButton: {
        backgroundColor: "#2563eb",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    saveServerButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    signOutButton: {
        marginTop: 20,
        backgroundColor: "#dc2626",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
    },
    signOutText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
