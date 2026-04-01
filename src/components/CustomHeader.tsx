import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Context } from '../context/store';
import HeaderNav from './common/HeaderNav';
import HeaderUser from './common/HeaderUser';
import HeaderLogin from './header/HeaderLogin';
import Search from './header/Search';
import { theme } from '../theme';
import { makeRequest } from './utils/makeRequest';
import { setItem } from './utils/local-storage';

const CustomHeader = ({ scene, previous, navigation }) => {
    const [state, dispatch] = useContext<any>(Context);
    const [loginForm, setLoginForm] = useState({ mobile: '', password: '' });
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginNotice, setLoginNotice] = useState<string | null>(null);

    const handleLogin = async (formOverride?: { mobile: string; password: string }) => {
        const activeForm = formOverride || loginForm;

        // Validation
        if (!activeForm.mobile || !activeForm.mobile.match(/(254|0|)?[71]\d{8}/)) {
            setLoginError('Invalid mobile number');
            return;
        }
        if (!activeForm.password || activeForm.password.length < 4) {
            setLoginError('Password must be at least 4 characters');
            return;
        }

        setLoginLoading(true);
        setLoginError(null);

        try {
            const data = {
                msisdn: activeForm.mobile,
                password: activeForm.password,
            };
            const response = await makeRequest({
                url: '/auth/login',
                method: 'POST',
                apiVersion: 2,
                data: data,
            });
            // Handle success & errors
            if (response?.status === 200 || response.status === 201) {
                if (response.data && response?.data?.data) {
                    // Dispatch user to global state
                    await setItem("user", response.data.data); // Save user data to local storage
                    dispatch({ type: 'SET', key: 'user', payload: response.data?.data });
                    // Close login modal
                    dispatch({ type: 'DEL', key: 'showloginmodal' });
                    dispatch({ type: 'DEL', key: 'loginmodalprefill' });
                    dispatch({ type: 'DEL', key: 'loginmodalmessage' });
                    setLoginNotice(null);
                } else {
                    setLoginError(response?.result || response?.error || 'Login failed');
                }
            } else {
                setLoginError(response.result?.message || response?.error?.message || 'Login failed');
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

        setLoginForm({
            mobile: prefill?.mobile || '',
            password: prefill?.password || '',
        });
        setLoginError(null);
        setLoginNotice(state?.loginmodalmessage || null);
    }, [state?.loginmodalprefill, state?.loginmodalmessage]);

    useEffect(() => {
        const prefill = state?.loginmodalprefill;

        if (
            state?.showloginmodal &&
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
    }, [state?.showloginmodal, state?.loginmodalprefill, loginLoading]);

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
                    {/* <Search /> */}
                    {state?.user ? <HeaderUser /> : <HeaderLogin />}
                </View>
            </View>

            <HeaderNav />

            {/* Login Modal */}
            <Modal
                visible={!!state?.showloginmodal}
                transparent
                animationType="fade"
                onRequestClose={() => dispatch({ type: 'DEL', key: 'showloginmodal' })}
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
                            value={loginForm.mobile}
                            onChangeText={(text) => setLoginForm({ ...loginForm, mobile: text })}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#ccc"
                            style={styles.input}
                            value={loginForm.password}
                            onChangeText={(text) => setLoginForm({ ...loginForm, password: text })}
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
                            onPress={() => {
                                dispatch({ type: 'DEL', key: 'showloginmodal' });
                                dispatch({ type: 'DEL', key: 'loginmodalprefill' });
                                dispatch({ type: 'DEL', key: 'loginmodalmessage' });
                                setLoginNotice(null);
                            }}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingBottom: 4, paddingTop: 12 },
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
});

export default CustomHeader;
