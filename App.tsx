import React, {
    useRef,
    useEffect,
    useState,
    useContext,
    Suspense,
    lazy,
    useMemo,
    useCallback,
} from "react";
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import Icon from "react-native-vector-icons/FontAwesome";

import { theme } from "./src/theme";
import Store, { Context } from "./src/context/store";
import { useBetslipCount } from "./src/stores/betslipStore";
import { AuthProvider } from "./src/AuthContext";
import { ConnectivityProvider } from "./src/context/ConnectivityContext";
import { SyncProvider, useSync } from "./src/context/SyncContext";

import SyncLoadingOverlay from "./src/components/SyncLoadingOverlay";
import LaunchScreen from "./src/components/LaunchScreen";
import AppSessionSync from "./src/components/AppSessionSync";
import BetslipHydrator from "./src/components/BetslipHydrator";
import CustomHeader from "./src/components/CustomHeader";
import MainLayout from "./src/components/layouts/MainLayout";
import { initDatabase } from "./src/services/offlineDatabase";

import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MatchAllMarketsScreen from "./src/screens/home/MatchAllMarketsScreen";
import ProfileScreen from "./src/screens/home/ProfileScreen";
import CasinoScreen from "./src/screens/home/CasinoScreen";
import DepositScreen from "./src/screens/home/DepositScreen";
import WithdrawScreen from "./src/screens/home/WithdrawScreen";
import MyBetsScreen from "./src/screens/home/MyBetsScreen";
import SelfExcludeScreen from "./src/screens/home/SelfExcludeScreen";
import JackpotScreen from "./src/screens/home/JackpotScreen";
import LiveScreen from "./src/screens/home/LiveScreen";
import CasinoLaunchedGameScreen from "./src/components/casino/CasinoLaunchedGameScreen";
import PromotionsScreen from "./src/screens/home/PromotionsScreen";
import LicensingScreen from "./src/screens/home/LicensingScreen";
import ResponsibleGamblingScreen from "./src/screens/home/ResponsibleGamblingScreen";
import GettingHelpScreen from "./src/screens/home/GettingHelpScreen";
import ContactUsScreen from "./src/screens/home/ContactUsScreen";
import SelfExclusionInfoScreen from "./src/screens/home/SelfExclusionInfoScreen";
import MinorsRestrictionsScreen from "./src/screens/home/MinorsRestrictionsScreen";
import SelfAssessmentScreen from "./src/screens/home/SelfAssessmentScreen";
import SupportForFriendsScreen from "./src/screens/home/SupportForFriendsScreen";

// Lazy load heavy components
const LazyHomeScreen = lazy(() => import("./src/screens/HomeScreen"));
const LazyCasinoScreen = lazy(() => import("./src/screens/home/CasinoScreen"));
const LazyJackpotScreen = lazy(() => import("./src/screens/home/JackpotScreen"));

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CasinoStack = createNativeStackNavigator();
const JackpotStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();

const TAB_BAR_HEIGHT = 60;

if (__DEV__ && !(global as any).__BETMUNDIAL_LOGS_SUPPRESSED__) {
  (global as any).__BETMUNDIAL_LOGS_SUPPRESSED__ = true;
  console.log = () => { };
  console.info = () => { };
  console.debug = () => { };
}

/* ================= PRELOAD WRAPPER COMPONENT ================= */
/**
 * Shows a preload screen first, then loads the actual heavy component
 * This creates a multi-stage loading experience:
 * 1. Instant preload (fast perceived response)
 * 2. After delay, heavy component mounts and initializes
 * 3. Component shows its own loading states
 */
const PreloadWrapper = React.memo(function PreloadWrapper({ Component, name }: { Component: React.ComponentType<any>, name: string }) {
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    // Defer component rendering to allow initial preload to render
    const timer = setTimeout(() => {
      setShowComponent(true);
    }, 0); // 400ms preload delay before heavy component mounts

    return () => clearTimeout(timer);
  }, []);

  // Show preload screen while heavy component hasn't been set to load
  if (!showComponent) {
    return (
      <View style={styles.lazyLoadingContainer}>
        <ActivityIndicator size="large" color="#a71f66" />
        <Text style={styles.lazyLoadingText}>Loading {name}...</Text>
      </View>
    );
  }

  // Render the actual heavy component (with its own loading states)
  return (
    <Suspense fallback={
      <View style={styles.lazyLoadingContainer}>
        <ActivityIndicator size="large" color="#a71f66" />
        <Text style={styles.lazyLoadingText}>Loading {name}...</Text>
      </View>
    }>
      <Component />
    </Suspense>
  );
});

/* ================= LAZY LOADED COMPONENTS ================= */
const LazyHomeScreenWrapper = React.memo(() => <PreloadWrapper Component={LazyHomeScreen} name="Sports" />);
const LazyCasinoScreenWrapper = React.memo(() => <PreloadWrapper Component={LazyCasinoScreen} name="Casino" />);
const LazyJackpotScreenWrapper = React.memo(() => <PreloadWrapper Component={LazyJackpotScreen} name="Jackpot" />);

/* ================= HOME STACK ================= */
const HomeStackScreen = React.memo(function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={LazyHomeScreenWrapper} />
      <HomeStack.Screen name="LoginScreen" component={LoginScreen} />
      <HomeStack.Screen name="RegisterScreen" component={RegisterScreen} />
      <HomeStack.Screen name="MatchAllMarketsScreen" component={MatchAllMarketsScreen} />
      <HomeStack.Screen name="DepositScreen" component={DepositScreen} />
      <HomeStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <HomeStack.Screen name="MyBetsScreen" component={MyBetsScreen} />
      <HomeStack.Screen name="SelfExcludeScreen" component={SelfExcludeScreen} />
      <HomeStack.Screen name="LiveScreen" component={LiveScreen} />
      <HomeStack.Screen name="PromotionsScreen" component={PromotionsScreen} />
      <HomeStack.Screen name="LicensingScreen" component={LicensingScreen} />
      <HomeStack.Screen name="ResponsibleGamblingScreen" component={ResponsibleGamblingScreen} />
      <HomeStack.Screen name="GettingHelpScreen" component={GettingHelpScreen} />
      <HomeStack.Screen name="ContactUsScreen" component={ContactUsScreen} />
      <HomeStack.Screen name="SelfExclusionInfoScreen" component={SelfExclusionInfoScreen} />
      <HomeStack.Screen name="MinorsRestrictionsScreen" component={MinorsRestrictionsScreen} />
      <HomeStack.Screen name="SelfAssessmentScreen" component={SelfAssessmentScreen} />
      <HomeStack.Screen name="SupportForFriendsScreen" component={SupportForFriendsScreen} />
    </HomeStack.Navigator>
  );
});

const AccountStackScreen = React.memo(function AccountStackScreen() {
  return (
    <AccountStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <AccountStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <AccountStack.Screen name="PromotionsScreen" component={PromotionsScreen} />
      <AccountStack.Screen name="LicensingScreen" component={LicensingScreen} />
      <AccountStack.Screen name="ResponsibleGamblingScreen" component={ResponsibleGamblingScreen} />
      <AccountStack.Screen name="GettingHelpScreen" component={GettingHelpScreen} />
      <AccountStack.Screen name="ContactUsScreen" component={ContactUsScreen} />
      <AccountStack.Screen name="SelfExclusionInfoScreen" component={SelfExclusionInfoScreen} />
      <AccountStack.Screen name="MinorsRestrictionsScreen" component={MinorsRestrictionsScreen} />
      <AccountStack.Screen name="SelfAssessmentScreen" component={SelfAssessmentScreen} />
      <AccountStack.Screen name="SupportForFriendsScreen" component={SupportForFriendsScreen} />
    </AccountStack.Navigator>
  );
});

/* ================= CASINO STACK ================= */
const CasinoStackScreen = React.memo(function CasinoStackScreen() {
  return (
    <CasinoStack.Navigator screenOptions={{ headerShown: false }}>
      <CasinoStack.Screen name="CasinoMain" component={LazyCasinoScreenWrapper} />
      <CasinoStack.Screen name="CasinoLaunchedGameScreen" component={CasinoLaunchedGameScreen} />
    </CasinoStack.Navigator>
  );
});

/* ================= JACKPOT STACK ================= */
const JackpotStackScreen = React.memo(function JackpotStackScreen() {
  return (
    <JackpotStack.Navigator screenOptions={{ headerShown: false }}>
      <JackpotStack.Screen name="JackpotMain" component={LazyJackpotScreenWrapper} />
    </JackpotStack.Navigator>
  );
})

/* ================= CENTER BETSLIP BUTTON ================= */
function BetslipButton() {
  const [, dispatch] = useContext(Context);
  const count = useBetslipCount();

  return (
    <TouchableOpacity
      style={styles.betslipButton}
      onPress={() =>
        dispatch({ type: "SET", key: "showmobileslip", payload: true })
      }
    >
      <Text style={styles.betslipBadgeText}>{count}</Text>
    </TouchableOpacity>
  );
}

/* ================= MAIN TABS ================= */
function MainTabs() {
  const [state, dispatch] = useContext(Context);
  const insets = useSafeAreaInsets();
  const openLoginModal = useCallback(() => {
    dispatch({ type: "SET", key: "showloginmodal", payload: true });
  }, [dispatch]);

  const tabBarStyle = useMemo(
    () => ({
      ...styles.tabBar,
      height: TAB_BAR_HEIGHT + insets.bottom,
      paddingBottom: insets.bottom,
    }),
    [insets.bottom]
  );

  return (
    <MainLayout>
      <View style={styles.mainTabsContainer}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            header: (props) => <CustomHeader {...props} />,
            headerStyle: {
              backgroundColor: theme.background,
              width: "100%",
            },
            lazy: true,
            tabBarIcon: ({ color, size }) => {
              const icons = {
                Sports: "home",
                Casino: "gamepad",
                Jackpot: "trophy",
                "Account": "user",
              };

              return (
                <Icon
                  name={icons[route.name] || "circle"}
                  size={size}
                  color={color}
                />
              );
            },

            tabBarActiveTintColor: "rgba(255, 215, 0, 1)", // gold
            tabBarInactiveTintColor: "#ffffff",

            tabBarStyle,
            tabBarLabelStyle: styles.tabLabel,
          })}
        >
          <Tab.Screen
            name="Sports"
            component={HomeStackScreen}
            listeners={{
              tabPress: (e) => {
                dispatch({ type: "SET", key: "playType", payload: "sports" });
              },
            }}
          />
          <Tab.Screen
            name="Casino"
            component={CasinoStackScreen}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault(); // stop default behavior
                dispatch({ type: "SET", key: "playType", payload: "casino" });
                navigation.navigate("Casino", {
                  screen: "CasinoMain",
                });
              },
            })}
          />
          <Tab.Screen
            name="Jackpot"
            component={JackpotStackScreen}
            listeners={{
              tabPress: (e) => {
                dispatch({ type: "SET", key: "playType", payload: "jackpot" });
              },
            }}
          />

          <Tab.Screen
            name="Account"
            component={AccountStackScreen}
            listeners={{
              tabPress: (e) => {
                dispatch({ type: "SET", key: "playType", payload: "account" });
                if (!state?.user) {
                  e.preventDefault();
                  openLoginModal();
                }
              },
            }}
          />

        </Tab.Navigator>

        {/* ✅ FLOATING BETSLIP BUTTON */}
        <View style={[styles.betslipWrapper, { bottom: 18 + insets.bottom }]}>
          <BetslipButton />
        </View>
      </View>
    </MainLayout>
  );
}

/* ================= ROOT NAVIGATOR ================= */
function RootNavigator({ navigationRef }) {
  const { isSyncing } = useSync();

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={MainTabs} />
        </RootStack.Navigator>
      </NavigationContainer>

      <SyncLoadingOverlay visible={isSyncing} message="Syncing data..." />
    </>
  );
}

/* ================= APP ENTRY ================= */
export default function App() {
  const navigationRef = useRef(null);
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        console.log("[APP] Database initialized");
      } catch (error) {
        console.error("[APP] Init error:", error);
      } finally {
        setIsLaunching(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <SystemBars style="light" />
      <View style={styles.container}>
        <SyncProvider>
          <Store>
            <AppSessionSync />
            <BetslipHydrator />
            <ConnectivityProvider>
              <AuthProvider>
                <RootNavigator navigationRef={navigationRef} />
              </AuthProvider>
            </ConnectivityProvider>
          </Store>
        </SyncProvider>

        <LaunchScreen visible={isLaunching} />
      </View>
    </SafeAreaProvider>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },

  mainTabsContainer: {
    flex: 1,
  },

  tabBar: {
    backgroundColor: "rgb(255,255,255, 0.3)",
    height: TAB_BAR_HEIGHT,
    borderTopWidth: 0,
    elevation: 10,
  },

  tabLabel: {
    fontSize: 12,
    marginBottom: 4,
  },

  /* FLOATING BETSLIP */
  betslipWrapper: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
  },

  betslipButton: {
    backgroundColor: "#e70654",
    width: 50,          // 🔽 smaller
    height: 50,         // 🔽 smaller
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  betslipBadgeText: {
    fontSize: 14,       // slightly bigger for visibility
    fontWeight: "700",
    color: "#fff",
  },

  lazyLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },

  lazyLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
});
