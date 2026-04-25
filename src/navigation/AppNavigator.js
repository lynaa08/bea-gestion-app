import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
 
import { useAuth, ROLES, hasRole } from "../context/AuthContext";
import {
  startPolling,
  stopPolling,
  subscribeToNotifs,
  getUnreadCount,
} from "../services/NotificationService";
 
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TachesScreen from "../screens/TachesScreen";
import ProjetDetailScreen from "../screens/ProjetDetailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProblemeScreen from "../screens/ProblemeScreen";
import SettingsScreen from "../screens/SettingsScreen"; // ← NOUVEAU
 
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
 
const COLORS = {
  primary: "#0D2B6E",
  active: "#5BB8E8",
  inactive: "#8A9FBF",
};
 
// ── Badge rouge sur l'icône de l'onglet ──────────────────────────────────
function TabIcon({ emoji, count, focused }) {
  return (
    <View style={ic.wrapper}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      {count > 0 && (
        <View style={ic.badge}>
          <Text style={ic.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </View>
  );
}
 
const ic = StyleSheet.create({
  wrapper: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#E74C3C",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});
 
// ── Tabs principaux ──────────────────────────────────────────────────────
function MainTabs() {
  const { user } = useAuth();
  const isDev = hasRole(user, ROLES.DEV);
  const [unreadCount, setUnreadCount] = useState(0);
 
  useEffect(() => {
    getUnreadCount().then(setUnreadCount);
    startPolling();
    const unsubscribe = subscribeToNotifs((nouvelles) => {
      setUnreadCount((prev) => prev + nouvelles.length);
    });
    return () => {
      unsubscribe();
      stopPolling();
    };
  }, []);
 
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E0EAF5",
          paddingBottom: 6,
          height: 62,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarLabel: () => null,
      })}>
 
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" count={0} focused={focused} />
          ),
        }}
      />
 
      <Tab.Screen
        name="Tâches"
        component={TachesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✅" count={0} focused={focused} />
          ),
        }}
      />
 
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" count={unreadCount} focused={focused} />
          ),
        }}
        listeners={{
          tabPress: () => setUnreadCount(0),
        }}
      />
 
      {isDev && (
        <Tab.Screen
          name="Problèmes"
          component={ProblemeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="⚠️" count={0} focused={focused} />
            ),
          }}
        />
      )}
 
      {/* ── Paramètres ── NOUVEAU */}
      <Tab.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" count={0} focused={focused} />
          ),
        }}
      />
 
    </Tab.Navigator>
  );
}
 
// ── Stack avec ProjetDetail ───────────────────────────────────────────────
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="ProjetDetail"
        component={ProjetDetailScreen}
        options={{
          headerShown: true,
          title: "Détail projet",
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </Stack.Navigator>
  );
}
 
// ── Navigateur principal ──────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
 
  return (
    <NavigationContainer>
      {user ? (
        <AppStack />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}