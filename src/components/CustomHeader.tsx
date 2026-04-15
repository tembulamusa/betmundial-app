import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Linking } from 'react-native';
import { Context } from '../context/store';
import HeaderNav from './common/HeaderNav';
import HeaderUser from './common/HeaderUser';
import HeaderLogin from './header/HeaderLogin';
import { theme } from '../theme';
import { makeRequest } from './utils/makeRequest';
import { getItem, setItem } from './utils/local-storage';
import { normalizeKenyanPhoneNumber } from './utils/phone';
import pkg from '../../package.json';
import { Platform } from 'react-native';


const CustomHeader = ({ scene, previous, navigation }) => {
    const [state, dispatch] = useContext<any>(Context);
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginNotice, setLoginNotice] = useState<string | null>(null);
    const clearGlobalLoginModalState = useCallback(() => {
        dispatch({ type: 'DEL', key: 'showloginmodal' });
        dispatch({ type: 'DEL', key: 'loginmodalprefill' });
        dispatch({ type: 'DEL', key: 'loginmodalmessage' });
    }, [dispatch]);
    const [localUser, setLocalUser] = useState<any>(null);
    const APP_VERSION = pkg.version;
    const VERSION_CACHE_KEY = "version_check_cache";
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [updateUrl, setUpdateUrl] = useState("");

    // Version CHeck and Alert
    const checkAppVersion = useCallback(async () => {
        try {
            // Check cache first
            const cache = await getItem(VERSION_CACHE_KEY);

            if (cache) {
                const parsed = typeof cache === "string" ? JSON.parse(cache) : cache;
                const now = Date.now();
                const twoDays = 2 * 24 * 60 * 60 * 1000;

                if (parsed?.nextCheck && now < parsed.nextCheck) {
                    // Skip check (user clicked "Later")
                    return;
                }
            }

            // Call API
            const response = await makeRequest({
                url: "/sports/app/apk/version", // 🔥 your endpoint
                method: "GET",
                apiVersion: 2,
            });
            const remoteVersion = response?.data?.version || response?.data?.data?.version;

            if (!remoteVersion) return;
            if (remoteVersion !== APP_VERSION) {
                setUpdateUrl(`https://api.betmundial.com/v2/sports/app/apk/download?platform=${Platform.OS}`);
                setIsUpdateModalVisible(true);
            }
        } catch (err) {
            console.log("Version check failed:", err);
        }
    }, []);

    useEffect(() => {
        checkAppVersion();
    }, []);



    // close modal
    const closeLoginModal = useCallback(() => {
        setIsLoginModalVisible(false);
        setLoginNotice(null);
        setLoginError(null);
        setTimeout(() => {
            clearGlobalLoginModalState();
        }, 0);
    }, [clearGlobalLoginModalState]);

    const openHeaderLoginModal = useCallback(() => {
        setLoginError(null);
        setLoginNotice(null);
        setIsLoginModalVisible(true);
    }, []);
    /* ================= LOAD USER FAST ================= */
    useEffect(() => {
        const loadUser = async () => {
            const cached = await getItem("user");

            if (cached) {
                dispatch({ type: 'SET', key: 'user', payload: cached });
            }
        };

        loadUser();
    }, []);
    useEffect(() => {
        if (state?.showloginmodal) {
            setIsLoginModalVisible(true);
        }
    }, [state?.showloginmodal]);

    const handleLogin = async (formOverride?: { mobile: string; password: string }) => {
        const activeForm = formOverride || { mobile, password };
        const normalizedMobile = normalizeKenyanPhoneNumber(activeForm.mobile);

        setLoginLoading(true);
        setLoginError(null);

        try {
            const data = {
                msisdn: mobile,
                password: password,
            };
            const response = await makeRequest({
                url: '/auth/login',
                method: 'POST',
                apiVersion: 2,
                data: data,
            });
            if (response?.status == 200 || response.status == 201) {
                if (response.data && response?.data?.data) {
                    // Dispatch user to global state
                    await setItem("user", response.data.data); // Save user data to local storage
                    dispatch({ type: 'SET', key: 'user', payload: response.data?.data });
                    // Close login modal
                    closeLoginModal();
                } else {
                    setLoginError(response?.result || response?.error || 'Login failed');
                }
            } else {
                setLoginError(response.result?.message || response?.error?.message || response?.error || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setLoginError('An error occurred during login');
        } finally {
            setLoginLoading(false);
        }
    };

    useEffect(() => {
        const prefill = state?.loginmodalprefill;
        if (!prefill) {
            return;
        }
        setMobile(prefill?.mobile || '');
        setPassword(prefill?.password || '');
        setLoginError(null);
        setLoginNotice(state?.loginmodalmessage || null);
        setIsLoginModalVisible(true);
    }, [state?.loginmodalprefill, state?.loginmodalmessage]);

    useEffect(() => {
        const prefill = state?.loginmodalprefill;

        if (
            isLoginModalVisible &&
            prefill?.autoLogin &&
            prefill?.mobile &&
            prefill?.password &&
            !loginLoading
        ) {
            dispatch({
                type: 'SET',
                key: 'loginmodalprefill',
                payload: {
                    ...prefill,
                    autoLogin: false,
                },
            });

            handleLogin({
                mobile: prefill.mobile,
                password: prefill.password,
            });
        }
    }, [isLoginModalVisible, state?.loginmodalprefill, loginLoading]);


    // Update Modal Handlers
    const handleLaterUpdate = async () => {
        const nextCheck = Date.now() + (2 * 24 * 60 * 60 * 1000);

        await setItem(
            VERSION_CACHE_KEY,
            JSON.stringify({ nextCheck })
        );

        setIsUpdateModalVisible(false);
    };

    const handleUpdateNow = () => {
        setIsUpdateModalVisible(false);
        if (updateUrl) {
            Linking.openURL(updateUrl);
        }
    };
    return (
        <View style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <View style={{ width: 120, justifyContent: "center" }}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={{ width: "100%", height: 50, resizeMode: "contain" }}
                    />
                </View>

                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {state?.user
                        ? <HeaderUser />
                        : <HeaderLogin onLoginPress={openHeaderLoginModal} />
                    }
                </View>
            </View>

            <HeaderNav />

            {/* Login Modal */}
            <Modal
                visible={isLoginModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeLoginModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Login</Text>
                        </View>

                        <TextInput
                            placeholder="Mobile / MSISDN"
                            placeholderTextColor="#ccc"
                            style={styles.input}
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#ccc"
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {loginNotice && <Text style={styles.noticeText}>{loginNotice}</Text>}
                        {loginError && <Text style={styles.errorText}>{loginError}</Text>}

                        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loginLoading}>
                            {loginLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={closeLoginModal}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Update Modal */}
            <Modal
                visible={isUpdateModalVisible}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.updateModalContent}>
                        <Text style={styles.updateTitle}>Update Available</Text>

                        <Text style={styles.updateText}>
                            A new version of the app is available. Please update for the best experience.
                        </Text>

                        <View style={styles.updateButtonRow}>
                            {/* Later */}
                            <TouchableOpacity
                                style={styles.laterButton}
                                onPress={handleLaterUpdate}
                            >
                                <Text style={styles.laterButtonText}>Later</Text>
                            </TouchableOpacity>

                            {/* Update */}
                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={handleUpdateNow}
                            >
                                <Text style={styles.updateButtonText}>Update</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingBottom: 4, paddingTop: 12 },
    logo: {
        width: "100%",
        height: 60,
        resizeMode: "contain"
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,12,36,0.91)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#0c0c24',
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: { backgroundColor: '#a71f66', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    input: { backgroundColor: '#1a1a2e', color: '#fff', borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, marginHorizontal: 20, marginTop: 12 },
    loginButton: { backgroundColor: '#a71f66', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginHorizontal: 20, marginTop: 16 },
    loginButtonText: { color: '#fff', fontWeight: 'bold' },
    closeButton: { marginTop: 10, alignItems: 'center', marginBottom: 16 },
    closeButtonText: { color: '#a71f66', fontWeight: 'bold' },
    noticeText: { color: '#86efac', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
    errorText: { color: '#F44336', marginTop: 4, textAlign: 'center' },
    updateModalContent: {
        width: '100%',
        maxWidth: 350,
        backgroundColor: '#0c0c24',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    updateTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
    },

    updateText: {
        color: '#ccc',
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
    },

    updateButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    laterButton: {
        flex: 1,
        backgroundColor: '#777d88', // gray
        paddingVertical: 18,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
        // paddingHorizontal: 8,
    },

    laterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },

    updateButton: {
        flex: 1,
        backgroundColor: 'rgb(190 24 93)', // green (success)
        paddingVertical: 18,
        borderRadius: 8,
        marginLeft: 8,
        paddingHorizontal: 8,
        textTransform: 'uppercase',
        alignItems: 'center',
    },

    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
});

export default CustomHeader;
