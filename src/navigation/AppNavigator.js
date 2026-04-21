import React from 'react';  
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { useAuth, ROLES, hasRole } from '../context/AuthContext';

import LoginScreen        from '../screens/LoginScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import TachesScreen       from '../screens/TachesScreen';
import ProjetDetailScreen from '../screens/ProjetDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProblemeScreen     from '../screens/ProblemeScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = {
  primary: '#0D2B6E',
  active:  '#5BB8E8',
  inactive:'#8A9FBF',
  bg:      '#F5F8FD',
};

function icon(name, focused) {
  const icons = {
    Dashboard:     focused ? '🏠' : '🏠',
    Tâches:        focused ? '✅' : '☑️',
    Notifications: focused ? '🔔' : '🔔',
    Problèmes:     focused ? '⚠️' : '⚠️',
  };
  return <Text style={{ fontSize: 18 }}>{icons[name] || '●'}</Text>;
}

function MainTabs() {
  const { user } = useAuth();
  const isDev = hasRole(user, ROLES.DEV);
  const isPMO = hasRole(user, ROLES.PMO, ROLES.ADMIN, ROLES.DIRECTEUR, ROLES.CHEF_DEPARTEMENT);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => icon(route.name, focused),
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E8EEF8',
          paddingBottom: 6,
          height: 60,
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard"    component={DashboardScreen} />
      <Tab.Screen name="Tâches"       component={TachesScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      {isDev && <Tab.Screen name="Problèmes" component={ProblemeScreen} />}
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"        component={MainTabs} />
      <Stack.Screen name="ProjetDetail" component={ProjetDetailScreen}
        options={{ headerShown: true, title: 'Détail projet',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff' }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      {user ? <AppStack /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
