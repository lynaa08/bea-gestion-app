import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { useAuth, ROLES, hasRole } from "../context/AuthContext";
import {
  startPolling,
  stopPolling,
  subscribeToNotifs,
  getUnreadCount,
} from "../services/NotificationService";
import {
  startDeviceStatsLogging,
  stopDeviceStatsLogging,
} from "../services/DeviceStatsService";
// ✅ Import du service deadline
import {
  startDeadlineCheck,
  stopDeadlineCheck,
} from "../services/DeadlineService";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import TachesScreen from "../screens/TachesScreen";
import TacheDetailScreen from "../screens/TacheDetailScreen";
import ProjetDetailScreen from "../screens/ProjetDetailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProblemeScreen from "../screens/ProblemeScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const COLORS = { primary: "#0D2B6E", active: "#5BB8E8", inactive: "#8A9FBF" };

function TabIcon({ iconLib, iconName, count, focused }) {
  const color = focused ? COLORS.active : COLORS.inactive;
  const Icon = iconLib === "material" ? MaterialIcons : Ionicons;
  return (
    <View style={ic.wrapper}>
      <Icon name={iconName} size={24} color={color} />
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

function MainTabs() {
  const { user } = useAuth();
  const isDev = hasRole(user, ROLES.DEV);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Charger le badge initial
    getUnreadCount().then(setUnreadCount);

    // Démarrer les services
    startPolling();
    startDeviceStatsLogging();

    // ✅ Démarrer la vérification des deadlines (DEV seulement)
    if (isDev) {
      startDeadlineCheck();
    }

    // S'abonner aux nouvelles notifs pour le badge
    const unsub = subscribeToNotifs((nouvelles) => {
      setUnreadCount((prev) => prev + nouvelles.length);
    });

    return () => {
      unsub();
      stopPolling();
      stopDeviceStatsLogging();
      if (isDev) stopDeadlineCheck();
    };
  }, [isDev]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E0EAF5",
          height: 62,
          paddingBottom: 6,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarLabel: () => null,
      }}>
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="home"
              count={0}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Tâches"
        component={TachesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconLib="material"
              iconName="check-circle"
              count={0}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="notifications"
              count={unreadCount}
              focused={focused}
            />
          ),
        }}
        listeners={{ tabPress: () => setUnreadCount(0) }}
      />

      {isDev && (
        <Tab.Screen
          name="Problèmes"
          component={ProblemeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                iconLib="material"
                iconName="warning"
                count={0}
                focused={focused}
              />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Paramètres"
        component={SettingsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="settings"
              count={0}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  const HEADER = {
    headerShown: true,
    headerStyle: { backgroundColor: COLORS.primary },
    headerTintColor: "#fff",
    headerTitleStyle: { fontWeight: "bold" },
  };
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="ProjetDetail"
        component={ProjetDetailScreen}
        options={{ ...HEADER, title: "Détail projet" }}
      />
      <Stack.Screen
        name="TacheDetail"
        component={TacheDetailScreen}
        options={{ ...HEADER, title: "Détail tâche" }}
      />
    </Stack.Navigator>
  );
}

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
