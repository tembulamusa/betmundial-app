import React, { memo, useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
    Pressable,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { WebView } from "react-native-webview";

const TAWK_CHAT_URL =
    "https://tawk.to/chat/69aeee647f65b51c3392421d/1jj9l6f39?layout=modern";

const MobileChat: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const openChat = useCallback(() => {
        setLoading(true);
        setOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <>
            <TouchableOpacity
                onPress={openChat}
                activeOpacity={0.85}
                accessibilityLabel="Open chat"
            >
                <LinearGradient
                    colors={["#a71f66", "#d12b7d"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chatBtn}
                >
                    <Text style={styles.chatBtnText}>Chat</Text>
                </LinearGradient>
            </TouchableOpacity>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={closeChat}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalInner}>
                        <Pressable
                            style={styles.closeBtn}
                            onPress={closeChat}
                            accessibilityLabel="Close chat"
                        >
                            <Text style={styles.closeBtnText}>×</Text>
                        </Pressable>

                        {loading && (
                            <View style={styles.loader}>
                                <ActivityIndicator size="large" color="#a71f66" />
                            </View>
                        )}

                        <WebView
                            source={{ uri: TAWK_CHAT_URL }}
                            style={styles.webview}
                            onLoadEnd={() => setLoading(false)}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState={false}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default memo(MobileChat);

const styles = StyleSheet.create({
    chatBtn: {
        minWidth: 52,
        minHeight: 26,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    chatBtnText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalInner: {
        width: "100%",
        maxWidth: 420,
        height: "80%",
        backgroundColor: "#0b1220",
        borderRadius: 12,
        overflow: "hidden",
    },
    closeBtn: {
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: {
        color: "#fff",
        fontSize: 22,
        lineHeight: 24,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b1220",
        zIndex: 5,
    },
    webview: {
        flex: 1,
        backgroundColor: "#0b1220",
    },
});
