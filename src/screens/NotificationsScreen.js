import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { getNotifications, markNotifRead, markAllNotifsRead } from "../api/api";

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

const TYPE_ICONS = {
  TACHE_ASSIGNEE: "📋",
  PROJET_CREE: "📁",
  PROJET_VALIDE: "✅",
  PROBLEME_SIGNALE: "⚠️",
  USER_CREE: "👤",
};

const TYPE_COLORS = {
  TACHE_ASSIGNEE: COLORS.primary,
  PROJET_CREE: COLORS.accent,
  PROJET_VALIDE: COLORS.success,
  PROBLEME_SIGNALE: COLORS.danger,
  USER_CREE: COLORS.warning,
};

export default function NotificationsScreen() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifs();
  };

  const markRead = async (id) => {
    await markNotifRead(id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lue: true } : n)),
    );
  };

  const dismiss = (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const markAll = async () => {
    await markAllNotifsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, lue: true })));
  };

  const unreadCount = notifs.filter((n) => !n.lue).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* ── Barre "tout marquer" ── */}
      {unreadCount > 0 && (
        <View style={styles.topBar}>
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={styles.topBarLabel}>non lue(s)</Text>
          <TouchableOpacity style={styles.markAllBtn} onPress={markAll}>
            <Text style={styles.markAllText}>✓ Tout marquer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Liste notifications ── */}
      <FlatList
        data={notifs}
        keyExtractor={(n) => String(n.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>Vous êtes à jour !</Text>
          </View>
        }
        renderItem={({ item: n }) => {
          const icon = TYPE_ICONS[n.type] || "🔔";
          const typeColor = TYPE_COLORS[n.type] || COLORS.accent;
          return (
            <View
              style={[
                styles.notifCard,
                !n.lue && {
                  borderLeftColor: typeColor,
                  backgroundColor: typeColor + "08",
                },
              ]}>
              {/* Icône type */}
              <View
                style={[styles.iconBox, { backgroundColor: typeColor + "22" }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              {/* Contenu */}
              <View style={{ flex: 1 }}>
                {n.titre ? (
                  <Text style={styles.notifTitre}>{n.titre}</Text>
                ) : null}
                <Text style={styles.notifMsg}>{n.message}</Text>
                {n.projetNom ? (
                  <Text style={styles.notifProjet}>📁 {n.projetNom}</Text>
                ) : null}
                <Text style={styles.notifDate}>
                  {n.dateCreation
                    ? new Date(n.dateCreation).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </Text>
              </View>

              {/* Boutons ✓ ✗ */}
              <View style={styles.actions}>
                {!n.lue && (
                  <TouchableOpacity
                    style={styles.btnOk}
                    onPress={() => markRead(n.id)}>
                    <Text style={styles.btnOkText}>✓</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.btnX}
                  onPress={() => dismiss(n.id)}>
                  <Text style={styles.btnXText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: COLORS.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  topBarLabel: { color: COLORS.muted, fontSize: 13, flex: 1 },
  markAllBtn: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },

  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: { fontSize: 18 },
  notifTitre: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 3,
  },
  notifMsg: { color: COLORS.text, fontSize: 13, lineHeight: 19 },
  notifProjet: { color: COLORS.accent, fontSize: 12, marginTop: 4 },
  notifDate: { color: COLORS.muted, fontSize: 11, marginTop: 4 },

  actions: { flexDirection: "column", gap: 6 },
  btnOk: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  btnOkText: { color: COLORS.success, fontWeight: "bold", fontSize: 16 },
  btnX: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEECEC",
    justifyContent: "center",
    alignItems: "center",
  },
  btnXText: { color: COLORS.danger, fontWeight: "bold", fontSize: 14 },

  emptyCard: {
    padding: 50,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptyText: { color: COLORS.muted, fontSize: 14 },
});
