import React, { useRef, useEffect, useState, useContext } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";

import { theme } from "./src/theme";
import Store, { Context } from "./src/context/store";
import { GlobalProvider } from "./src/context/GlobalContext";
import { AuthProvider } from "./src/AuthContext";
import { ConnectivityProvider } from "./src/context/ConnectivityContext";
import { SyncProvider, useSync } from "./src/context/SyncContext";

import ConnectivityDebugger from "./src/components/ConnectivityDebugger";
import SyncLoadingOverlay from "./src/components/SyncLoadingOverlay";
import LaunchScreen from "./src/components/LaunchScreen";
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

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CasinoStack = createNativeStackNavigator();
const JackpotStack = createNativeStackNavigator();

const TAB_BAR_HEIGHT = 60;

/* ================= HOME STACK ================= */
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="LoginScreen" component={LoginScreen} />
      <HomeStack.Screen name="RegisterScreen" component={RegisterScreen} />
      <HomeStack.Screen name="MatchAllMarketsScreen" component={MatchAllMarketsScreen} />
      <HomeStack.Screen name="DepositScreen" component={DepositScreen} />
      <HomeStack.Screen name="WithdrawScreen" component={WithdrawScreen} />
      <HomeStack.Screen name="MyBetsScreen" component={MyBetsScreen} />
      <HomeStack.Screen name="SelfExcludeScreen" component={SelfExcludeScreen} />
      <HomeStack.Screen name="LiveScreen" component={LiveScreen} />
    </HomeStack.Navigator>
  );
}

/* ================= CASINO STACK ================= */
function CasinoStackScreen() {
  return (
    <CasinoStack.Navigator screenOptions={{ headerShown: false }}>
      <CasinoStack.Screen name="CasinoMain" component={CasinoScreen} />
      <CasinoStack.Screen name="CasinoLaunchedGameScreen" component={CasinoLaunchedGameScreen} />
    </CasinoStack.Navigator>
  );
}

/* ================= JACKPOT STACK ================= */
function JackpotStackScreen() {
  return (
    <JackpotStack.Navigator screenOptions={{ headerShown: false }}>
      <JackpotStack.Screen name="JackpotMain" component={JackpotScreen} />
    </JackpotStack.Navigator>
  );
}

/* ================= CENTER BETSLIP BUTTON ================= */
function BetslipButton() {
  const [state, dispatch] = useContext(Context);

  const count = Object.keys(state?.betslip || {}).length || 0;

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
  const [, dispatch] = useContext(Context);

  return (
    <MainLayout>
      <View style={styles.mainTabsContainer}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            header: (props) => <CustomHeader {...props} />,

            tabBarIcon: ({ color, size }) => {
              const icons = {
                Sports: "home",
                Casino: "gamepad",
                Jackpot: "trophy",
                Dashboard: "user",
              };

              return (
                <Icon
                  name={icons[route.name] || "circle"}
                  size={size}
                  color={color}
                />
              );
            },

            tabBarActiveTintColor: "#ffffff",
            tabBarInactiveTintColor: "#999999",

            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabLabel,
          })}
        >
          <Tab.Screen
            name="Sports"
            component={HomeStackScreen}
            listeners={{
              tabPress: () => {
                dispatch({ type: "SET", key: "playType", payload: "sports" });
              },
            }}
          />

          <Tab.Screen
            name="Casino"
            component={CasinoStackScreen}
            listeners={({ navigation, route }) => ({
              tabPress: () => {
                const navState = navigation.getState();
                dispatch({ type: "SET", key: "playType", payload: "casino" });
                const tab = navState.routes.find(r => r.name === route.name);

                if (tab?.state?.index > 0) {
                  navigation.dispatch({
                    ...navigation.navigate(route.name),
                    type: "POP_TO_TOP",
                    target: tab.key,
                  });
                }
              },
            })}
          />
          <Tab.Screen
            name="Jackpot"
            component={JackpotStackScreen}
            listeners={{
              tabPress: () => {
                dispatch({ type: "SET", key: "playType", payload: "jackpot" });
              },
            }}
          />

          <Tab.Screen name="Dashboard" component={ProfileScreen} />
        </Tab.Navigator>

        {/* ✅ FLOATING BETSLIP BUTTON */}
        <View style={styles.betslipWrapper}>
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
      <ConnectivityDebugger />
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
        setTimeout(() => setIsLaunching(false), 2000);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <SyncProvider>
          <Store>
            <GlobalProvider>
              <ConnectivityProvider>
                <AuthProvider>
                  <RootNavigator navigationRef={navigationRef} />
                </AuthProvider>
              </ConnectivityProvider>
            </GlobalProvider>
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
});
