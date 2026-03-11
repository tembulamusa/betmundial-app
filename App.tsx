import React, { useRef, useEffect, useState } from "react";
import { View } from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome";

import { theme } from "./src/theme";
import Store from "./src/context/store";
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

import {
  LoginScreen,
  RegisterScreen,
  HomeScreen,
  MatchAllMarketsScreen,
  SettingsScreen,
  ProfileScreen,
  CasinoScreen
} from "./src/screens";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TAB_BAR_HEIGHT = 60;

/* ================= HOME STACK ================= */
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="MatchAllMarketsScreen" component={MatchAllMarketsScreen} />
    </HomeStack.Navigator>
  );
}

/* ================= MAIN TABS ================= */
function MainTabs() {
  return (
    <MainLayout>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          header: (props) => <CustomHeader {...props} />,
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, string> = { Home: "home", Settings: "cog", Profile: "user" };
            return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: { backgroundColor: "rgba(0,12,36,1)", height: TAB_BAR_HEIGHT },
          tabBarLabelStyle: { fontSize: 12 },
        })}
      >
        <Tab.Screen name="Sports" component={HomeStackScreen} />
        <Tab.Screen name="Casino" component={CasinoScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </MainLayout>
  );
}

/* ================= ROOT NAVIGATOR ================= */
function RootNavigator({ navigationRef }: { navigationRef: React.RefObject<NavigationContainerRef<any>> }) {
  const { isSyncing } = useSync();

  return (
    <>
      <ConnectivityDebugger />
      <NavigationContainer ref={navigationRef}>
        <RootStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
      <SyncLoadingOverlay visible={isSyncing} message="Syncing data..." />
    </>
  );
}

/* ================= APP ENTRY ================= */
export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
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
      <View style={{ flex: 1, backgroundColor: theme.background }}>
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