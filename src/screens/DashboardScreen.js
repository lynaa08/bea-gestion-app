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
} from "react-native";
import { getNotifications, markNotifRead, getMesProjets } from "../api/api";
import { useAuth, canCreateTache } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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

  const statutColor = (s) => {
    if (!s) return C.muted;
    const sl = s.toUpperCase();
    if (sl.includes("ACTIF") || sl.includes("EN_COURS")) return C.success;
    if (sl.includes("TERMINE")) return C.primary;
    if (sl.includes("RETARD")) return C.danger;
    return C.warning;
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </View>
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 30 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* ── Notifications ── */}
      {notifs.length > 0 && (
        <View
          style={[
            styles.card,
            { backgroundColor: C.card, borderColor: C.border },
          ]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.text }]}>
              {" "}
              Notifications
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}>
              <Text style={{ color: C.accent, fontSize: 13 }}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {notifs.map((n) => (
            <View
              key={n.id}
              style={[styles.notifRow, { borderTopColor: C.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 11, marginBottom: 2 }}>
                  {n.dateCreation || n.date}
                </Text>
                <Text style={{ color: C.text, fontSize: 13 }} numberOfLines={2}>
                  {n.message}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => dismissNotif(n.id)}
                style={[styles.notifBtn, { backgroundColor: C.btnOkBg }]}>
                <Text
                  style={{
                    color: C.success,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}>
                  ✓
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Projets ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>
          {" "}
          Mes Projets
        </Text>
      </View>

      {projets.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}>
          <MaterialIcons name="folder-open" size={40} color={C.border} />
          <Text style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>
            Aucun projet assigné
          </Text>
        </View>
      ) : (
        projets.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.projetCard,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
            onPress={() =>
              navigation.navigate("ProjetDetail", { projetId: p.id })
            }
            activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontWeight: "bold", fontSize: 15 }}>
                {p.nom}
              </Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                {p.matricule}
              </Text>
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
            <Text style={{ color: C.muted, fontSize: 22, marginLeft: 4 }}>
              {" "}
              ›
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "bold", fontSize: 15 },
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  notifBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: { fontWeight: "bold", fontSize: 16 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  projetCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  emptyCard: {
    margin: 16,
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
});
