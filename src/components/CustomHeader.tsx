import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Context } from '../context/store';
import HeaderNav from './common/HeaderNav';
import HeaderUser from './common/HeaderUser';
import HeaderLogin from './header/HeaderLogin';
import Search from './header/Search';
import MobileChat from './header/MobileChat';
import { theme } from '../theme';
import { makeRequest } from './utils/makeRequest';
import { getItem, setItem, normalizeUser } from './utils/local-storage';
import { normalizeKenyanPhoneNumber } from './utils/phone';

const CustomHeader = ({ scene, previous, navigation }) => {
    const [state, dispatch] = useContext<any>(Context);
    const insets = useSafeAreaInsets();
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginNotice, setLoginNotice] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const { width: screenWidth } = useWindowDimensions();
    const topBandRef = useRef<View>(null);
    const [topBandOffsetX, setTopBandOffsetX] = useState(0);

    const syncTopBandBleed = useCallback(() => {
        topBandRef.current?.measureInWindow((x) => {
            setTopBandOffsetX(x);
        });
    }, []);

    useEffect(() => {
        syncTopBandBleed();
    }, [state?.user, searchOpen, syncTopBandBleed]);

    const clearGlobalLoginModalState = useCallback(() => {
        dispatch({ type: 'DEL', key: 'showloginmodal' });
        dispatch({ type: 'DEL', key: 'loginmodalprefill' });
        dispatch({ type: 'DEL', key: 'loginmodalmessage' });
    }, [dispatch]);

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

    useEffect(() => {
        const loadUser = async () => {
            const cached = await getItem("user");
            if (cached) {
                dispatch({ type: 'SET', key: 'user', payload: normalizeUser(cached) });
            }
        };
        loadUser();
    }, [dispatch]);

    useEffect(() => {
        if (state?.showloginmodal) {
            setIsLoginModalVisible(true);
        }
    }, [state?.showloginmodal]);

    const handleLogin = async (formOverride?: { mobile: string; password: string }) => {
        const activeForm = formOverride || { mobile, password };

        setLoginLoading(true);
        setLoginError(null);

        try {
            const response = await makeRequest({
                url: '/auth/login',
                method: 'POST',
                apiVersion: 2,
                data: {
                    msisdn: normalizeKenyanPhoneNumber(activeForm.mobile),
                    password: activeForm.password,
                },
            });

            if (response?.status == 200 || response.status == 201) {
                const payload = response.data?.data || response.data;
                if (payload && (payload.access_token || payload.token)) {
                    const user = normalizeUser(payload);
                    await setItem("user", user);
                    dispatch({ type: 'SET', key: 'user', payload: user });
                    closeLoginModal();
                } else {
                    setLoginError(response?.result || response?.error || 'Login failed');
                }
            } else {
                setLoginError(
                    response.result?.message ||
                    response?.error?.message ||
                    response?.error ||
                    'Login failed'
                );
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
        if (!prefill) return;
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
                payload: { ...prefill, autoLogin: false },
            });
            handleLogin({ mobile: prefill.mobile, password: prefill.password });
        }
    }, [isLoginModalVisible, state?.loginmodalprefill, loginLoading]);

    const logoBandPad = state?.user ? 6 : 4;

    return (
        <View style={styles.headerRoot}>
            <View
                ref={topBandRef}
                onLayout={syncTopBandBleed}
                style={[
                    styles.headerTopBand,
                    state?.user && styles.headerTopBandLoggedIn,
                    { paddingTop: insets.top + logoBandPad },
                ]}
            >
                {state?.user ? (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.headerTopBandBleed,
                            {
                                left: -topBandOffsetX,
                                width: screenWidth,
                            },
                        ]}
                    />
                ) : null}
                <View style={styles.headerInner}>
                    <View
                        style={[
                            styles.headerRow,
                            searchOpen && styles.headerRowExpanded,
                            state?.user && !searchOpen && styles.headerRowLoggedIn,
                        ]}
                    >
                        {!searchOpen && (
                            <TouchableOpacity
                                style={styles.logoWrap}
                                onPress={() => navigation.navigate("Sports", { screen: "HomeMain" })}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={styles.logo}
                                />
                            </TouchableOpacity>
                        )}

                        <View style={[styles.searchSlot, searchOpen && styles.searchSlotExpanded]}>
                            <Search onActiveChange={setSearchOpen} />
                            {!searchOpen && <MobileChat />}
                        </View>
                    </View>
                </View>
            </View>

            {!searchOpen && (
                <View
                    style={[
                        styles.headerInner,
                        styles.mobileActionsRow,
                        state?.user && styles.mobileActionsRowLoggedIn,
                    ]}
                >
                    {state?.user ? (
                        <HeaderUser />
                    ) : (
                        <HeaderLogin onLoginPress={openHeaderLoginModal} />
                    )}
                </View>
            )}

            <HeaderNav
                containerStyle={state?.user ? styles.headerNavLoggedIn : undefined}
            />

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
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            value={mobile}
                            onChangeText={setMobile}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#94a3b8"
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {loginNotice ? <Text style={styles.noticeText}>{loginNotice}</Text> : null}
                        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => handleLogin()}
                            disabled={loginLoading}
                        >
                            {loginLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeButton} onPress={closeLoginModal}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerRoot: {
        width: "100%",
        alignSelf: "stretch",
        backgroundColor: theme.background,
        paddingBottom: 8,
        overflow: "visible",
    },
    headerTopBand: {
        width: "100%",
        alignSelf: "stretch",
        overflow: "visible",
    },
    headerTopBandLoggedIn: {
        paddingBottom: 6,
        marginBottom: 0,
        overflow: "visible",
    },
    headerTopBandBleed: {
        position: "absolute",
        top: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
    },
    headerInner: {
        width: "100%",
        paddingHorizontal: 10,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 40,
    },
    headerRowLoggedIn: {
        minHeight: 38,
    },
    headerRowExpanded: {
        alignItems: "stretch",
    },
    logoWrap: {
        flexShrink: 0,
        justifyContent: "center",
    },
    logo: {
        width: 130,
        height: 36,
        resizeMode: "contain",
    },
    searchSlot: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 8,
        minWidth: 0,
    },
    searchSlotExpanded: {
        flex: 1,
        alignItems: "stretch",
    },
    mobileActionsRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "100%",
        marginTop: 8,
        paddingTop: 4,
    },
    mobileActionsRowLoggedIn: {
        marginTop: 0,
        paddingTop: 8,
        paddingBottom: 8,
    },
    headerNavLoggedIn: {
        marginTop: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,12,36,0.91)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
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
    modalHeader: {
        backgroundColor: theme.accent,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    input: {
        backgroundColor: '#1a1a2e',
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 20,
        marginTop: 12,
    },
    loginButton: {
        backgroundColor: theme.accent,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 16,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 10,
        alignItems: 'center',
        marginBottom: 16,
    },
    closeButtonText: {
        color: theme.accent,
        fontWeight: 'bold',
    },
    noticeText: {
        color: '#86efac',
        marginTop: 10,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        color: '#F44336',
        marginTop: 4,
        textAlign: 'center',
    },
});

export default CustomHeader;
