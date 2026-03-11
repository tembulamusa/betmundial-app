import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";

import HomeStackScreen from "./HomeStackScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BetslipIndex from "../components/betslip/BetslipIndex";

const Tab = createBottomTabNavigator();
const TAB_BAR_HEIGHT = 60;

export default function MainTabs() {
    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        const icons: Record<string, string> = { Home: "home", Settings: "cog", Profile: "user" };
                        return <Icon name={icons[route.name] || "circle"} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: "#fff",
                    tabBarInactiveTintColor: "#999",
                    tabBarStyle: { backgroundColor: "rgba(0,12,36,1)", height: TAB_BAR_HEIGHT },
                    tabBarLabelStyle: { fontSize: 12 },
                    headerShown: false,
                })}
            >
                <Tab.Screen name="Home" component={HomeStackScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            {/* Betslip footer above tabs */}
            <BetslipIndex footerOffset={TAB_BAR_HEIGHT} />
        </View>
    );
}