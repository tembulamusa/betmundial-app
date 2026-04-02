import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  StatusBar,
  Easing,
  Image,
} from 'react-native';

interface LaunchScreenProps {
  visible: boolean;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(0.2)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoBounce = useRef(new Animated.Value(0)).current;

  // 🔁 Infinite logo bounce (1 second cycle)
  const startLogoBounce = () => {
    Animated.sequence([
      Animated.timing(logoBounce, {
        toValue: -15,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoBounce, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) {
        startLogoBounce(); // loop manually
      }
    });
  };

  // 🔁 Infinite text bounce
  const startTextBounce = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -8,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) {
        startTextBounce();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      console.log('[LAUNCH] LaunchScreen visible, starting animations');

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Logo pop-in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Start loops
      startLogoBounce();
      startTextBounce();
    }

    return () => {
      // Cleanup animations
      logoBounce.stopAnimation();
      bounceAnim.stopAnimation();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <StatusBar backgroundColor="#000C24" barStyle="light-content" />

      <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
        <View style={styles.container}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: logoBounce },
                ],
                opacity: fadeAnim,
              },
            ]}
          >
            <Image
              source={require('../assets/images/launch-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.brandName,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            <Text style={styles.brandBet}>Bet</Text>
            <Text style={styles.brandMundial}>Mundial</Text>
          </Animated.Text>

          <Animated.Text
            style={[
              styles.tagline,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            The best betting experience for both sports and casino
          </Animated.Text>

          {/* Loader */}
          <ActivityIndicator
            size="large"
            color="#FFFFFF"
            style={styles.spinner}
          />

          {/* Text */}
          <Animated.Text
            style={[
              styles.mainMessage,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            Launching betMundial App
          </Animated.Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000C24',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'transparent',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    minWidth: 300,
    borderWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  logoContainer: {
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  brandBet: {
    color: '#FFD700',
  },
  brandMundial: {
    color: '#a71f66',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 260,
    lineHeight: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  mainMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default LaunchScreen;
