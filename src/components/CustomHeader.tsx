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

    const handleLogin = async () => {
        // Validation
        if (!loginForm.mobile || !loginForm.mobile.match(/(254|0|)?[71]\d{8}/)) {
            setLoginError('Invalid mobile number');
            return;
        }
        if (!loginForm.password || loginForm.password.length < 4) {
            setLoginError('Password must be at least 4 characters');
            return;
        }

        setLoginLoading(true);
        setLoginError(null);

        try {
            const data = {
                msisdn: loginForm.mobile,
                password: loginForm.password,
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

    return (
        <View style={{ backgroundColor: theme.background }}>
            <View style={styles.header}>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} />
                <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Search />
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
                            onPress={() => dispatch({ type: 'DEL', key: 'showloginmodal' })}
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
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: 10, paddingVertical: 20 },
    logo: { width: 120, height: 60 },

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
    errorText: { color: '#F44336', marginTop: 4, textAlign: 'center' },
});

export default CustomHeader;