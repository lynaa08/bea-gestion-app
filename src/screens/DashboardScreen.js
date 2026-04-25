import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import { getNotifications, markNotifRead, getProjets } from "../api/api";
import { useAuth, canCreateTache } from "../context/AuthContext";
const COLORS = {
  primary: "#0D2B6E",
  accent: "#5BB8E8",
  bg: "#F5F8FD",
  card: "#fff",
  border: "#E0EAF5",
  text: "#1A2B4A",
  muted: "#8A9FBF",
  success: "#27AE60",
  danger: "#E74C3C",
  warning: "#F39C12",
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [n, p] = await Promise.all([getNotifications(), getProjets()]);
      setNotifs(n.slice(0, 3)); // Afficher les 3 dernières
      setProjets(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const dismissNotif = async (id) => {
    await markNotifRead(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const statutColor = (s) => {
    if (!s) return COLORS.muted;
    const sl = s.toUpperCase();
    if (sl.includes("ACTIF") || sl.includes("EN_COURS")) return COLORS.success;
    if (sl.includes("TERMINE")) return COLORS.primary;
    if (sl.includes("RETARD")) return COLORS.danger;
    return COLORS.warning;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* ── Header user ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.prenom?.[0] || "") + (user?.nom?.[0] || "")}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>
            {user?.prenom} {user?.nom}
          </Text>
          <Text style={styles.userSub}>
            {user?.matricule} · {user?.role}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* ── Notifications résumé ── */}
      {notifs.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {notifs.map((n) => (
            <View key={n.id} style={styles.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifDate}>{n.dateCreation || n.date}</Text>
                <Text style={styles.notifMsg} numberOfLines={2}>
                  {n.message}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => dismissNotif(n.id)}
                style={styles.notifBtn}>
                <Text style={styles.notifCheck}>✓</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Projets ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Projets</Text>
        {canCreateTache(user) && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("CreateProjet")}>
            <Text style={styles.addBtnText}>+ Nouveau</Text>
          </TouchableOpacity>
        )}
      </View>

      {projets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucun projet assigné</Text>
        </View>
      ) : (
        projets.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.projetCard}
            onPress={() =>
              navigation.navigate("ProjetDetail", { projetId: p.id })
            }
            activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.projetNom}>{p.nom}</Text>
              <Text style={styles.projetSub}>{p.matricule}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                backgroundColor: statutColor(p.statut) + "22",
                marginLeft: 8,
              }}>
              <Text
                style={{
                  color: statutColor(p.statut),
                  fontSize: 11,
                  fontWeight: "600",
                }}>
                {p.statut || "N/A"}
              </Text>
            </View>
            <Text style={styles.arrow}> ›</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  userName: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  userSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  logoutText: { color: "#fff", fontSize: 12 },

  card: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { color: COLORS.text, fontWeight: "bold", fontSize: 15 },
  seeAll: { color: COLORS.accent, fontSize: 13 },

  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  notifDate: { color: COLORS.muted, fontSize: 11, marginBottom: 2 },
  notifMsg: { color: COLORS.text, fontSize: 13 },
  notifBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  notifCheck: { color: COLORS.success, fontWeight: "bold", fontSize: 16 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { color: COLORS.text, fontWeight: "bold", fontSize: 16 },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  projetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projetNom: { color: COLORS.text, fontWeight: "bold", fontSize: 15 },
  projetSub: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  statutBadge: (color) => ({
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: color + "22",
    marginLeft: 8,
  }),
  statutText: (color) => ({ color, fontSize: 11, fontWeight: "600" }),
  arrow: { color: COLORS.muted, fontSize: 22, marginLeft: 4 },

  emptyCard: {
    margin: 16,
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.muted, fontSize: 14 },
});
