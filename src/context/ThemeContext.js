// src/context/ThemeContext.js
// ─────────────────────────────────────────────────────────────
// Gestion du thème : manuel (toggle) OU automatique (système).
// L'utilisateur peut forcer light/dark via le switch dans Paramètres.
// Si aucune préférence sauvegardée → suit le thème système (useColorScheme).
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "pref_theme_override"; // "light" | "dark" | null

const LIGHT = {
  isDark: false,
  bg: "#F5F8FD",
  card: "#FFFFFF",
  modalBox: "#FFFFFF",
  inputBg: "#F5F8FD",
  statsRow: "#FFFFFF",
  filtersBar: "#FFFFFF",
  topBar: "#FFFFFF",
  inputBar: "#FFFFFF",
  text: "#1A2B4A",
  muted: "#8A9FBF",
  label: "#5A6A82",
  border: "#E0EAF5",
  borderFocus: "#0D2B6E",
  primary: "#0D2B6E",
  accent: "#5BB8E8",
  success: "#27AE60",
  danger: "#E74C3C",
  warning: "#F39C12",
  btnOkBg: "#E8F5E9",
  btnXBg: "#FEECEC",
  sousTacheRowDone: "#F8FFF8",
  tabBar: "#FFFFFF",
  tabBarBorder: "#E0EAF5",
  tabBarActive: "#5BB8E8",
  tabBarInactive: "#8A9FBF",
  header: "#0D2B6E",
  headerText: "#FFFFFF",
  grad: ["#061840", "#0D2B6E", "#1A52A8", "#2A72CC"],
};

const DARK = {
  isDark: true,
  bg: "#0F1523",
  card: "#1A2035",
  modalBox: "#1E2540",
  inputBg: "#141929",
  statsRow: "#1A2035",
  filtersBar: "#1A2035",
  topBar: "#1A2035",
  inputBar: "#1A2035",
  text: "#E2E8F8",
  muted: "#6B7FA3",
  label: "#8899BB",
  border: "#2A3555",
  borderFocus: "#5BB8E8",
  primary: "#0D2B6E",
  accent: "#5BB8E8",
  success: "#27AE60",
  danger: "#E74C3C",
  warning: "#F39C12",
  btnOkBg: "#0D2A10",
  btnXBg: "#2A0D0D",
  sousTacheRowDone: "#0D2A10",
  tabBar: "#111827",
  tabBarBorder: "#1E2A3A",
  tabBarActive: "#5BB8E8",
  tabBarInactive: "#4A5A7A",
  header: "#111827",
  headerText: "#E2E8F8",
  grad: ["#061840", "#0D2B6E", "#1A52A8", "#2A72CC"],
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // "dark" | "light" | null
  const [override, setOverride] = useState(null); // null = follow system

  // Charger la préférence sauvegardée au démarrage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") setOverride(saved);
      } catch {}
    })();
    }, []);

  // Thème effectif : override manuel OU système
    const activeScheme = override ?? systemScheme ?? "light";
      const C = activeScheme === "dark" ? DARK : LIGHT;

  async function toggleTheme() {
    const next = C.isDark ? "light" : "dark";
    setOverride(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, next); } catch {}
  }

  async function setTheme(scheme) {
    setOverride(scheme);
    try { await AsyncStorage.setItem(STORAGE_KEY, scheme); } catch {}
  }

  return (
    <ThemeContext.Provider value={{ C, isDark: C.isDark, toggleTheme, setTheme, override }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
