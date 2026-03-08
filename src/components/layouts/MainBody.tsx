import * as React from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
import ConnectivityStatus from '../../components/ConnectivityStatus';
import ConnectivityToast from '../../components/ConnectivityToast';
import { theme } from '../../theme';

type Props = { children: React.ReactNode };

export default function MainLayout({ children }: Props) {
    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle="light-content" />
            <ConnectivityStatus />
            <ConnectivityToast />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1 },
});
