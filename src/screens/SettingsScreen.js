import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Circle, Line, Rect, Polyline } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
 
const KEYS = { darkMode: "pref_dark_mode" };
 
const LIGHT = {
  primary: "#0D2B6E",
  bg: "#F5F8FD",
  card: "#fff",
  border: "#E0EAF5",
  text: "#1A2B4A",
  muted: "#8A9FBF",
  iconBg: "#EEF4FF",
  logoutBorder: "#FFE0DE",
  logoutIconBg: "#FFF0EF",
};
 
const DARK = {
  primary: "#0D2B6E",
  bg: "#12152E",
  card: "#1C2140",
  border: "#2A2F5A",
  text: "#E8EEFF",
  muted: "#7A8FBF",
  iconBg: "#1A2050",
  logoutBorder: "#4A2020",
  logoutIconBg: "#3A1515",
};
 
function IconSun({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="5" />
      <Line x1="12" y1="1" x2="12" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="23" />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <Line x1="1" y1="12" x2="3" y2="12" />
      <Line x1="21" y1="12" x2="23" y2="12" />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </Svg>
  );
}
 
function IconMoon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}
 
function IconUser({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}
 
function IconBriefcase({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="7" width="20" height="14" rx="2" />
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </Svg>
  );
}
 
function IconCard({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="5" width="20" height="14" rx="2" />
      <Line x1="2" y1="10" x2="22" y2="10" />
    </Svg>
  );
}
 
function IconLogout({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}
 
function IconBox({ bg, children }) {
  return (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      {children}
    </View>
  );
}
 
export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const C = darkMode ? DARK : LIGHT;
 
  useEffect(() => {
    (async () => {
      try {
        const dark = await AsyncStorage.getItem(KEYS.darkMode);
        if (dark !== null) setDarkMode(dark === "true");
      } catch (e) {}
    })();
  }, []);
 
  async function handleDarkMode(value) {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem(KEYS.darkMode, String(value));
    } catch (e) {}
  }
 
  function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: logout },
    ]);
  }
 
  const initiales = user?.nom
    ? user.nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";
 
  const iconColor = darkMode ? "#7A8FBF" : "#0D2B6E";
 
  return (
    <View style={{ flex: 1, backgroundColor: C.primary }}>
 
      {/* ── Header bleu ── */}
      <View style={styles.headerBg}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initiales}</Text>
          </View>
          <Text style={styles.userName}>{user?.nom || "Utilisateur"}</Text>
          <Text style={styles.userRole}>{user?.role || ""}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{user?.matricule || ""}</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Actif</Text>
            </View>
          </View>
        </View>
      </View>
 
      {/* ── Body + Logout ── */}
      <View style={[styles.body, { backgroundColor: C.bg }]}>
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Apparence */}
          <Text style={[styles.sectionLbl, { color: C.muted }]}>Apparence</Text>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <IconBox bg={C.iconBg}>
                {darkMode ? <IconMoon color={iconColor} /> : <IconSun color={iconColor} />}
              </IconBox>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: C.text }]}>
                  {darkMode ? "Mode sombre" : "Mode clair"}
                </Text>
                <Text style={[styles.rowSub, { color: C.muted }]}>
                  Thème de l'application
                </Text>
              </View>
              <View style={[styles.modeLabel, { backgroundColor: C.iconBg }]}>
                <Text style={[styles.modeLabelText, { color: C.primary }]}>
                  {darkMode ? "Sombre" : "Clair"}
                </Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleDarkMode}
                trackColor={{ false: C.border, true: C.primary }}
                thumbColor="#fff"
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
 
          {/* Mon compte */}
          <Text style={[styles.sectionLbl, { color: C.muted }]}>Mon compte</Text>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
 
            <View style={[styles.row, { borderBottomColor: C.border }]}>
              <IconBox bg={C.iconBg}><IconUser color={iconColor} /></IconBox>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Nom</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.nom || "—"}</Text>
              </View>
            </View>
 
            <View style={[styles.row, { borderBottomColor: C.border }]}>
              <IconBox bg={C.iconBg}><IconBriefcase color={iconColor} /></IconBox>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Rôle</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.role || "—"}</Text>
              </View>
            </View>
 
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <IconBox bg={C.iconBg}><IconCard color={iconColor} /></IconBox>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Matricule</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.matricule || "—"}</Text>
              </View>
            </View>
 
          </View>
        </ScrollView>
 
        {/* ── Déconnexion fixe en bas ── */}
        <View style={[styles.logoutWrapper, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[styles.logoutCard, { backgroundColor: C.card, borderColor: C.logoutBorder }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <IconBox bg={C.logoutIconBg}>
              <IconLogout color="#E74C3C" />
            </IconBox>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
 
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: "#0D2B6E",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 50,
  },
  headerTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 18,
    textAlign: "center",
  },
  avatarWrap: { alignItems: "center", gap: 6 },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  userRole: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  badgePill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgePillText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "500" },
 
  body: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionLbl: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 11, marginBottom: 2 },
  modeLabel: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  modeLabelText: { fontSize: 11, fontWeight: "700" },
 
  // Logout fixe en bas
  logoutWrapper: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 0,
  },
  logoutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logoutText: { color: "#E74C3C", fontSize: 15, fontWeight: "700" },
});