import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from "react-native";
import Svg, { Path, Circle, Line, Rect, Polyline } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function IconSun({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="5" />
      <Line x1="12" y1="1" x2="12" y2="3" /><Line x1="12" y1="21" x2="12" y2="23" />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <Line x1="1" y1="12" x2="3" y2="12" /><Line x1="21" y1="12" x2="23" y2="12" />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}
function IconBriefcase({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="7" width="20" height="14" rx="2" /><Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </Svg>
  );
}
function IconCard({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="5" width="20" height="14" rx="2" /><Line x1="2" y1="10" x2="22" y2="10" />
    </Svg>
  );
}
function IconLogout({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" /><Line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}

export default function SettingsScreen() {
  const { C, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const iconColor = isDark ? "#7A8FBF" : "#0D2B6E";
  const iconBg = isDark ? "#1A2050" : "#EEF4FF";

  const initiales = user?.nom
    ? user.nom.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  function handleLogout() {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0D2B6E" }}>
      {/* ── Header bleu fixe ── */}
      <View style={styles.headerBg}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initiales}</Text>
          </View>
          <Text style={styles.userName}>{user?.nom || "Utilisateur"}</Text>
          <Text style={styles.userRole}>{user?.role || ""}</Text>
          <View style={styles.badgesRow}>
            <View style={styles.badgePill}><Text style={styles.badgePillText}>{user?.matricule || ""}</Text></View>
            <View style={styles.badgePill}><Text style={styles.badgePillText}>Actif</Text></View>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={[styles.body, { backgroundColor: C.bg }]}>
        <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

          {/* Apparence — VRAI SWITCH */}
          <Text style={[styles.sectionLbl, { color: C.muted }]}>Apparence</Text>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                {isDark ? <IconMoon color={iconColor} /> : <IconSun color={iconColor} />}
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { color: C.text }]}>
                  {isDark ? "Mode sombre" : "Mode clair"}
                </Text>
                <Text style={[styles.rowSub, { color: C.muted }]}>
                  Thème de l'application
                </Text>
              </View>
              <View style={[styles.modeLabel, { backgroundColor: iconBg }]}>
                <Text style={[styles.modeLabelText, { color: "#0D2B6E" }]}>
                  {isDark ? "Sombre" : "Clair"}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: C.border, true: "#0D2B6E" }}
                thumbColor="#fff"
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>

          {/* Mon compte */}
          <Text style={[styles.sectionLbl, { color: C.muted }]}>Mon compte</Text>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.row, { borderBottomColor: C.border }]}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}><IconUser color={iconColor} /></View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Nom</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.nom || "—"}</Text>
              </View>
            </View>
            <View style={[styles.row, { borderBottomColor: C.border }]}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}><IconBriefcase color={iconColor} /></View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Rôle</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.role || "—"}</Text>
              </View>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}><IconCard color={iconColor} /></View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowSub, { color: C.muted }]}>Matricule</Text>
                <Text style={[styles.rowTitle, { color: C.text }]}>{user?.matricule || "—"}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Déconnexion ── */}
        <View style={[styles.logoutWrapper, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[styles.logoutCard, { backgroundColor: C.card, borderColor: isDark ? "#4A2020" : "#FFE0DE" }]}
            onPress={handleLogout} activeOpacity={0.75}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? "#3A1515" : "#FFF0EF" }]}>
              <IconLogout color="#E74C3C" />
            </View>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBg: { backgroundColor: "#0D2B6E", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 50 },
  headerTitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 18, textAlign: "center" },
  avatarWrap: { alignItems: "center", gap: 6 },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 3, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarInitials: { color: "#fff", fontSize: 28, fontWeight: "700" },
  userName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  userRole: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  badgesRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  badgePill: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgePillText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "500" },
  body: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  bodyContent: { padding: 16, paddingBottom: 8 },
  sectionLbl: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600" },
  rowSub: { fontSize: 11, marginBottom: 2 },
  modeLabel: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  modeLabelText: { fontSize: 11, fontWeight: "700" },
  logoutWrapper: { padding: 16, paddingBottom: 20 },
  logoutCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  logoutText: { color: "#E74C3C", fontSize: 15, fontWeight: "700" },
});
