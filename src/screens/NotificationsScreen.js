import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import NotificationBellIcon from "../components/NotificationBellIcon";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { getNotifications, markNotifRead, markAllNotifsRead, deleteNotification } from "../api/api";
import { refreshNow } from "../services/NotificationService";
import { useTheme } from "../context/ThemeContext";

const TYPE_COLORS_FN = (C) => ({
  TACHE_ASSIGNEE: C.primary,
  TACHE_TERMINEE: C.success,
  PROJET_CREE: C.accent,
  PROJET_VALIDE: C.success,
  PROBLEME_SIGNALE: C.danger,
});

export default function NotificationsScreen() {
  const { C } = useTheme();
  const TYPE_COLORS = TYPE_COLORS_FN(C);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifs = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifs(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNow();
    await loadNotifs();
  };

  const markRead = async (id) => {
    await markNotifRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true } : n)));
  };

  const dismiss = async (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try { await deleteNotification(id); } catch { loadNotifs(); }
  };

  const markAll = async () => {
    await markAllNotifsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, lue: true })));
  };

  const unreadCount = notifs.filter((n) => !n.lue).length;

  if (loading) return (
    <View style={[styles.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {unreadCount > 0 && (
        <View style={[styles.topBar, { backgroundColor: C.topBar, borderBottomColor: C.border }]}>
          <View style={[styles.unreadBadge, { backgroundColor: C.danger }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
          <Text style={[styles.topBarLabel, { color: C.muted }]}>non lue(s)</Text>
          <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: C.primary + "15" }]} onPress={markAll}>
            <Text style={[styles.markAllText, { color: C.primary }]}>✓ Tout marquer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifs}
        keyExtractor={(n) => String(n.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.accent]} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <MaterialIcons name="notifications" size={56} color={C.border} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>Aucune notification</Text>
            <Text style={{ color: C.muted, fontSize: 14 }}>Tirez vers le bas pour actualiser</Text>
          </View>
        }
        renderItem={({ item: n }) => {
          const color = TYPE_COLORS[n.type] || C.accent;
          return (
            <View style={[styles.notifCard, { backgroundColor: C.card, borderColor: C.border },
              !n.lue && { borderLeftColor: color, backgroundColor: color + "08" }]}>
              <View style={[styles.iconBox, { backgroundColor: color + "22" }]}>
                <NotificationBellIcon size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                {n.titre ? <Text style={[styles.notifTitre, { color: C.text }]}>{n.titre}</Text> : null}
                <Text style={{ color: C.text, fontSize: 13, lineHeight: 19 }}>{n.message}</Text>
                {n.projetNom ? (
                  <Text style={{ color: C.accent, fontSize: 12, marginTop: 4 }}>
                    <MaterialIcons name="folder" size={12} color={C.accent} /> {n.projetNom}
                  </Text>
                ) : null}
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                  {n.dateCreation ? new Date(n.dateCreation).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                  }) : ""}
                </Text>
              </View>
              <View style={styles.actions}>
                {!n.lue && (
                  <TouchableOpacity style={[styles.btnOk, { backgroundColor: C.btnOkBg }]} onPress={() => markRead(n.id)}>
                    <Text style={{ color: C.success, fontWeight: "bold", fontSize: 16 }}>✓</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.btnX, { backgroundColor: C.btnXBg }]} onPress={() => dismiss(n.id)}>
                  <Text style={{ color: C.danger, fontWeight: "bold", fontSize: 14 }}>✕</Text>
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
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  unreadBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  unreadBadgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  topBarLabel: { fontSize: 13, flex: 1 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  markAllText: { fontSize: 13, fontWeight: "600" },
  notifCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderLeftWidth: 4, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  notifTitre: { fontWeight: "bold", fontSize: 14, marginBottom: 3 },
  actions: { flexDirection: "column", gap: 6 },
  btnOk: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  btnX: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  emptyCard: { padding: 50, alignItems: "center", borderRadius: 16, borderWidth: 1 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, marginTop: 12 },
});
