import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { useAuth, ROLES, hasRole } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  startNotifPolling,
  stopNotifPolling,
  getUnreadCount,
} from "../services/NotificationService";
import {
  startDeadlineCheck,
  stopDeadlineCheck,
} from "../services/DeadlineService";
import {
  startDeviceStatsLogging,
  stopDeviceStatsLogging,
} from "../services/DeviceStatsService";

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

function TabIcon({ iconLib, iconName, count, focused, color }) {
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

// Pour les TABS (TachesScreen) — grand
function HeaderLogo() {
  return (
    <Image
      source={require("../../assets/images/favicon.png")}
      style={{ width: 42, height: 42, resizeMode: "contain", marginLeft: 12 }}
    />
  );
}

// Pour le STACK (TacheDetailScreen) — même style
function HeaderLogoStack() {
  return (
    <Image
      source={require("../../assets/images/favicon.png")}
      style={{ width: 36, height: 36, resizeMode: "contain", marginLeft: 12 }}
    />
  );
}

function MainTabs() {
  const { user } = useAuth();
  const { C, isDark } = useTheme();
  const isDev = hasRole(user, ROLES.DEV);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Charger le nombre de non-lues au démarrage
    getUnreadCount().then(setUnreadCount);

    // Démarrer le polling avec callback pour incrémenter le badge
    startNotifPolling((nouvelleNotif) => {
      setUnreadCount((prev) => prev + 1);
    });

    // Vérifier les deadlines (tous les rôles)
    startDeadlineCheck();
    startDeviceStatsLogging();

    return () => {
      stopNotifPolling();
      stopDeadlineCheck();
      stopDeviceStatsLogging();
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: C.tabBarActive,
        tabBarInactiveTintColor: C.tabBarInactive,
        tabBarStyle: {
          backgroundColor: C.tabBar,
          borderTopColor: C.tabBarBorder,
          height: 62,
          paddingBottom: 6,
        },
        // Header natif activé pour tous les onglets
        headerStyle: { backgroundColor: C.header },
        headerTintColor: C.headerText,
        headerTitleStyle: { fontWeight: "bold", fontSize: 15, marginLeft: 8 },
        // Logo cercle blanc à gauche de tous les headers
        headerLeft: () => <HeaderLogo />,
        tabBarLabel: () => null,
      }}>
      {/* Accueil — header natif activé avec logo cercle */}
      <Tab.Screen
        name="Accueil"
        component={DashboardScreen}
        options={{
          headerShown: true,
          headerLeft: () => <HeaderLogo />,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="home"
              count={0}
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Tâches"
        component={TachesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconLib="material"
              iconName="check-circle"
              count={0}
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="notifications"
              count={unreadCount}
              focused={focused}
              color={color}
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
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                iconLib="material"
                iconName="warning"
                count={0}
                focused={focused}
                color={color}
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              iconLib="ionicons"
              iconName="settings"
              count={0}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { C } = useTheme();
const HEADER = {
  headerShown: true,
  headerStyle: { backgroundColor: C.header },  
  headerTintColor: C.headerText,
  headerTitleStyle: { fontWeight: "bold", fontSize: 15 },
  headerTitleAlign: "center",
  headerLeft: () => <HeaderLogoStack />,  
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
  const { C, isDark } = useTheme();

  if (loading) return null;

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: C.bg,
          card: C.header,
          text: C.text,
          border: C.tabBarBorder,
          notification: "#E74C3C",
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: C.bg,
          card: C.header,
          text: C.text,
          border: C.tabBarBorder,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
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
