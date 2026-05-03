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

// ── Logo icône BEA dans un cercle blanc avec relief ──────────
// Fond BLANC fixe dans les 2 modes — le logo a déjà ses propres couleurs
function HeaderLogo() {
  return (
    <View
      style={{
        marginLeft: 19,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.5)",
        justifyContent: "center",
        alignItems: "center",
        // Relief iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Relief Android
        elevation: 5,
      }}>
      <Image
        source={require("../../assets/images/favicon.png")}
        style={{ width: 26, height: 26, resizeMode: "contain" }}
      />
    </View>
  );
}

function MainTabs() {
  const { user } = useAuth();
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
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#E0EAF5",
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
  const HEADER = {
    headerShown: true,
    headerStyle: { backgroundColor: C.header },
    headerTintColor: C.headerText,
    headerTitleStyle: { fontWeight: "bold", fontSize: 15, marginLeft: 8 },
    headerTitleContainerStyle: { paddingLeft: 12 },
    headerLeft: () => <HeaderLogo />,
    headerTitleAlign: "center",
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
