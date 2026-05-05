import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { getNotifications, markNotifRead, getMesProjets } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Couleur de l'avatar selon le nom du projet
const avatarColor = (nom) => {
  const colors = ["#2563EB", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#EC4899"];
  if (!nom) return colors[0];
  return colors[nom.charCodeAt(0) % colors.length];
};

const statutConfig = (s) => {
  if (!s) return { label: "N/A", color: "#6B7280", bg: "#F3F4F6" };
  const sl = s.toUpperCase();
  if (sl.includes("ACTIF") || sl.includes("EN_COURS"))
    return { label: s, color: "#059669", bg: "#D1FAE5" };
  if (sl.includes("TERMINE"))
    return { label: s, color: "#2563EB", bg: "#DBEAFE" };
  if (sl.includes("RETARD"))
    return { label: s, color: "#DC2626", bg: "#FEE2E2" };
  return { label: s, color: "#D97706", bg: "#FEF3C7" };
};

export default function DashboardScreen({ navigation }) {
  const { C } = useTheme();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [n, p] = await Promise.all([getNotifications(), getMesProjets()]);
      setNotifs(n.slice(0, 3));
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

  const firstName = user?.prenom || user?.nom || "Dev";
  const initials = firstName.slice(0, 2).toUpperCase();
  const activeCount = projets.filter((p) => {
    const s = (p.statut || "").toUpperCase();
    return s.includes("ACTIF") || s.includes("EN_COURS");
  }).length;

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: "#F1F5F9" }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F1F5F9" }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <StatusBar barStyle="light-content" />

      {/* ── Header bleu ── */}
      <View style={styles.header}>
      

        {/* Texte */}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerLabel}>Accueil</Text>
          <Text style={styles.headerGreeting}>Bonjour, {firstName} </Text>
          <Text style={styles.headerSub}>Ravi de vous revoir !</Text>
          <View style={styles.headerUnderline} />
        </View>
      </View>

      {/* ── Carte Projets Actifs ── */}
      <View style={styles.activeCard}>
        <View style={styles.activeCardIcon}>
          <MaterialIcons name="folder" size={28} color="#2563EB" />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.activeCount}>{activeCount || projets.length}</Text>
          <Text style={styles.activeLabel}>projets en cours</Text>
        </View>


        {/* Décoration */}
        <View style={styles.activeDecoration}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.decorFolder,
                { right: i * 14, bottom: i * 6, opacity: 0.15 + i * 0.12 },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ── Notifications récentes ── */}
      {notifs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications récentes</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
              style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <MaterialIcons name="chevron-right" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>

          <View style={styles.notifCard}>
            {notifs.map((n, idx) => (
              <View
                key={n.id}
                style={[
                  styles.notifRow,
                  idx > 0 && { borderTopWidth: 1, borderTopColor: "#F1F5F9" },
                ]}>
                {/* Barre latérale bleue */}
                <View style={styles.notifAccent} />

                {/* Icône */}
                <View style={styles.notifIconWrap}>
                  <MaterialIcons name="assignment" size={20} color="#2563EB" />
                </View>

                {/* Contenu */}
                <View style={{ flex: 1 }}>
                  <View style={styles.notifTagRow}>
                    <View style={styles.notifTag}>
                      <Text style={styles.notifTagText}>Tâche assignée</Text>
                    </View>
                    <Text style={styles.notifTime}>{n.dateCreation || n.date || "Il y a 2h"}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>
                    {n.message}
                  </Text>
                </View>

                {/* Bouton OK */}
                <TouchableOpacity
                  onPress={() => dismissNotif(n.id)}
                  style={styles.notifBtn}>
                  <MaterialIcons name="check-circle-outline" size={22} color="#059669" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Mes Projets ── */}
      <View style={styles.section}>
      <View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Mes projets</Text>
</View>

        {projets.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="folder-open" size={44} color="#CBD5E1" />
            <Text style={styles.emptyText}>Aucun projet assigné</Text>
          </View>
        ) : (
          <View style={styles.projetList}>
            {projets.map((p, idx) => {
              const sc = statutConfig(p.statut);
              const letter = (p.nom || "?")[0].toUpperCase();
              const bg = avatarColor(p.nom);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.projetRow,
                    idx < projets.length - 1 && styles.projetRowBorder,
                  ]}
                  onPress={() =>
                    navigation.navigate("ProjetDetail", { projetId: p.id })
                  }
                  activeOpacity={0.7}>
                  {/* Avatar lettre */}
                  <View style={[styles.projetAvatar, { backgroundColor: bg }]}>
                    <Text style={styles.projetAvatarText}>{letter}</Text>
                  </View>

                  {/* Nom + matricule */}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.projetNom} numberOfLines={1}>
                      {p.nom}
                    </Text>
                  </View>

                  {/* Badge statut */}
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.color }]}>
                      {p.statut?.toUpperCase().includes("RETARD")
                        ? "RETARD"
                        : "ACTIF"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  /* Header */
header: {
  backgroundColor: "transparent", 
  paddingTop: 40,
  paddingBottom: 10,
  paddingHorizontal: 20,
},
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#1E40AF",
  },
  headerLabel: { color: "#1E40AF", fontSize: 18, marginBottom: 2 },
  headerGreeting: { color: "#1E40AF", fontSize: 28
    , fontWeight: "700" },
  headerSub: { color: "#1E40AF", fontSize: 13, marginTop: 2 },
  headerUnderline: {
    marginTop: 8,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
  },

  /* Carte Projets Actifs */
  activeCard: {
    margin: 16,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeCount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 36,
  },
  activeLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  activeMotivation: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  activeDecoration: { position: "absolute", right: 16, bottom: 0, top: 0 },
  decorFolder: {
    position: "absolute",
    width: 48,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  /* Sections */
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  seeAllBtn: { flexDirection: "row", alignItems: "center" },
  seeAllText: { color: "#2563EB", fontSize: 13, fontWeight: "500" },

  /* Notif Card */
  notifCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingRight: 14,
  },
  notifAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#2563EB",
    borderRadius: 2,
    marginRight: 10,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifTagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notifTag: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  notifTagText: { color: "#1D4ED8", fontSize: 11, fontWeight: "600" },
  notifTime: { color: "#94A3B8", fontSize: 11 },
  notifMessage: { color: "#1E293B", fontSize: 13, fontWeight: "500" },
  notifBtn: { marginLeft: 8 },

  /* Projets */
  projetList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  projetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  projetRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  projetAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  projetAvatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  projetNom: { color: "#0F172A", fontWeight: "600", fontSize: 14 },
  projetSubRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  projetDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  projetMeta: { color: "#64748B", fontSize: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },

  /* Empty */
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
  },
  emptyText: { color: "#94A3B8", fontSize: 14, marginTop: 10 },
});