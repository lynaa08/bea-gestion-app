import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { getMesTaches, createTache, getMesProjets } from "../api/api";
import { useAuth, ROLES, hasRole } from "../context/AuthContext";

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

const STATUT_LABELS = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  BLOQUEE: "Bloquée",
};
const STATUT_COLORS = {
  A_FAIRE: COLORS.muted,
  EN_COURS: COLORS.warning,
  TERMINEE: COLORS.success,
  BLOQUEE: COLORS.danger,
};
const FILTERS = ["Tous", "A_FAIRE", "EN_COURS", "TERMINEE", "BLOQUEE"];

export default function TachesScreen({ navigation }) {
  const { user } = useAuth();
  // ✅ Seulement le DEV peut créer une tâche pour lui-même
  const isDev = hasRole(user, ROLES.DEV);

  const [taches, setTaches] = useState([]);
  const [filtre, setFiltre] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal création ──
  const [showModal, setShowModal] = useState(false);
  const [projets, setProjets] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    description: "",
    priorite: "MOYENNE",
    dateEcheance: "",
    projetId: null,
  });

  const loadTaches = useCallback(async () => {
    try {
      const data = await getMesTaches();
      setTaches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTaches();
  }, [loadTaches]);
  const onRefresh = () => {
    setRefreshing(true);
    loadTaches();
  };

  // ── Format date JJ/MM/AAAA automatique ──
  const handleDateChange = (val) => {
    const digits = val.replace(/[^\d]/g, "").substring(0, 8);
    let formatted = digits;
    if (digits.length > 2)
      formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4)
      formatted =
        digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setForm((f) => ({ ...f, dateEcheance: formatted }));
  };

  // ── Ouvrir modal ──
  const openModal = async () => {
    setForm({
      titre: "",
      description: "",
      priorite: "MOYENNE",
      dateEcheance: "",
      projetId: null,
    });
    try {
      // ✅ Le DEV voit seulement ses projets
      const p = await getMesProjets();
      setProjets(p || []);
    } catch {
      setProjets([]);
    }
    setShowModal(true);
  };

  // ── Créer la tâche ──
  const submitCreate = async () => {
    if (!form.titre.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire.");
      return;
    }
    if (!form.projetId) {
      Alert.alert("Erreur", "Sélectionnez un projet.");
      return;
    }
    // Convertir JJ/MM/AAAA → AAAA-MM-JJ
    let dateForBackend = null;
    if (form.dateEcheance && form.dateEcheance.length === 10) {
      const parts = form.dateEcheance.split("/");
      if (parts.length === 3)
        dateForBackend = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setCreating(true);
    try {
      await createTache({
        titre: form.titre.trim(),
        description: form.description || null,
        priorite: form.priorite,
        dateEcheance: dateForBackend,
        projetId: form.projetId,
        // ✅ Le DEV s'assigne automatiquement la tâche
        assigneMatricule: user?.matricule,
      });
      setShowModal(false);
      Alert.alert("✅ Créée", "Tâche créée et assignée à vous !");
      loadTaches();
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de créer la tâche.");
    } finally {
      setCreating(false);
    }
  };

  const filtered =
    filtre === "Tous" ? taches : taches.filter((t) => t.statut === filtre);

  const stats = {
    total: taches.length,
    faites: taches.filter((t) => t.statut === "TERMINEE").length,
    enCours: taches.filter((t) => t.statut === "EN_COURS").length,
    aFaire: taches.filter((t) => t.statut === "A_FAIRE").length,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        <StatBox label="Total" value={stats.total} color={COLORS.primary} />
        <StatBox label="À faire" value={stats.aFaire} color={COLORS.muted} />
        <StatBox
          label="En cours"
          value={stats.enCours}
          color={COLORS.warning}
        />
        <StatBox label="Faites" value={stats.faites} color={COLORS.success} />
      </View>

      {/* ── Filtres ── */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s}
        style={styles.filtersBar}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.filterChip, filtre === s && styles.filterChipActive]}
            onPress={() => setFiltre(s)}>
            <Text
              style={[
                styles.filterChipText,
                filtre === s && styles.filterChipTextActive,
              ]}>
              {s === "Tous" ? "Tous" : STATUT_LABELS[s]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* ── Liste tâches ── */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: 12, paddingBottom: isDev ? 90 : 30 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="assignment" size={56} color="#C0D0E8" />
            <Text style={styles.emptyTitle}>Aucune tâche</Text>
            <Text style={styles.emptyText}>
              {filtre === "Tous"
                ? isDev
                  ? "Aucune tâche assignée. Créez-en une avec le bouton +."
                  : "Aucune tâche assignée."
                : `Aucune tâche "${STATUT_LABELS[filtre]}".`}
            </Text>
          </View>
        }
        renderItem={({ item: t }) => {
          const isDone = t.statut === "TERMINEE";
          const color = STATUT_COLORS[t.statut] || COLORS.muted;
          const dl = getDeadlineInfo(t.dateEcheance, t.statut);
          return (
            <TouchableOpacity
              style={[styles.tacheCard, { borderLeftColor: color }]}
              onPress={() =>
                navigation.navigate("TacheDetail", { tacheId: t.id })
              }
              activeOpacity={0.75}>
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tacheTitre, isDone && styles.done]}>
                  {t.titre}
                </Text>
                {t.projetNom ? (
                  <Text style={styles.projetLabel}>📁 {t.projetNom}</Text>
                ) : null}
                <Text style={styles.devName}>
                  👤 {t.assignePrenom} {t.assigneNom || "Non assigné"}
                </Text>
                {t.dateEcheance ? (
                  <Text style={[styles.deadlineLbl, { color: dl.color }]}>
                    {dl.icon} {formatDate(t.dateEcheance)} · {dl.label}
                  </Text>
                ) : null}
              </View>
              <View style={{ gap: 4, alignItems: "flex-end" }}>
                <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {STATUT_LABELS[t.statut] || t.statut}
                  </Text>
                </View>
                <Text style={styles.tapHint}>Voir détails ›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ✅ FAB "+" visible seulement pour le DEV */}
      {isDev && (
        <TouchableOpacity
          style={styles.fab}
          onPress={openModal}
          activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── Modal création tâche (DEV seulement) ── */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}>
          <View style={styles.modalBox}>
            {/* Handle */}
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>➕ Nouvelle tâche</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.lbl}>Titre *</Text>
              <TextInput
                style={styles.inp}
                placeholder="Titre de la tâche..."
                placeholderTextColor={COLORS.muted}
                value={form.titre}
                onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))}
              />

              <Text style={styles.lbl}>Description</Text>
              <TextInput
                style={[styles.inp, { height: 70, textAlignVertical: "top" }]}
                placeholder="Description..."
                placeholderTextColor={COLORS.muted}
                multiline
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              />

              <Text style={styles.lbl}>Priorité</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                {["BASSE", "MOYENNE", "HAUTE"].map((p) => {
                  const colors = {
                    BASSE: COLORS.success,
                    MOYENNE: COLORS.warning,
                    HAUTE: COLORS.danger,
                  };
                  const isActive = form.priorite === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.pChip,
                        { borderColor: colors[p] },
                        isActive && { backgroundColor: colors[p] },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, priorite: p }))}>
                      <Text
                        style={[
                          styles.pChipTxt,
                          { color: isActive ? "#fff" : colors[p] },
                        ]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.lbl}>Date d'échéance</Text>
              <TextInput
                style={styles.inp}
                placeholder="JJ/MM/AAAA  ex: 30/06/2026"
                placeholderTextColor={COLORS.muted}
                value={form.dateEcheance}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text
                style={{ color: COLORS.muted, fontSize: 11, marginBottom: 8 }}>
                Les / s'ajoutent automatiquement
              </Text>

              <Text style={styles.lbl}>Projet *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}>
                {projets.length === 0 ? (
                  <Text
                    style={{
                      color: COLORS.muted,
                      fontSize: 13,
                      fontStyle: "italic",
                      paddingVertical: 8,
                    }}>
                    Aucun projet disponible
                  </Text>
                ) : (
                  projets.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.projChip,
                        form.projetId === p.id && styles.projChipActive,
                      ]}
                      onPress={() =>
                        setForm((f) => ({ ...f, projetId: p.id }))
                      }>
                      <Text
                        style={[
                          styles.projChipTxt,
                          form.projetId === p.id && { color: "#fff" },
                        ]}>
                        {p.nom}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* ✅ Info : tâche auto-assignée au DEV */}
              <View style={styles.selfBox}>
                <Text style={styles.selfTxt}>
                  👤 La tâche sera assignée à vous automatiquement
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowModal(false)}>
                <Text style={{ color: COLORS.muted, fontWeight: "600" }}>
                  Annuler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmit, creating && { opacity: 0.6 }]}
                onPress={submitCreate}
                disabled={creating}>
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  {creating ? "Création..." : "✓ Créer"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function StatBox({ label, value, color }) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getDeadlineInfo(dateEcheance, statut) {
  if (!dateEcheance || statut === "TERMINEE")
    return { color: COLORS.muted, icon: "", label: "" };
  const diff = Math.ceil((new Date(dateEcheance) - new Date()) / 86400000);
  if (diff < 0)
    return {
      color: COLORS.danger,
      icon: "⛔",
      label: `${Math.abs(diff)}j retard`,
    };
  if (diff === 0)
    return { color: COLORS.danger, icon: "🔥", label: "Aujourd'hui !" };
  if (diff === 1)
    return { color: COLORS.danger, icon: "⚠️", label: "Demain !" };
  if (diff <= 3)
    return { color: COLORS.warning, icon: "📅", label: `${diff}j restants` };
  return { color: COLORS.muted, icon: "📅", label: `${diff}j restants` };
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 3,
  },
  statValue: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  filtersBar: {
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 52,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, color: COLORS.muted },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },
  tacheCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  tacheTitre: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 3,
  },
  done: { textDecorationLine: "line-through", color: COLORS.muted },
  projetLabel: { color: COLORS.accent, fontSize: 12 },
  devName: { color: COLORS.muted, fontSize: 12 },
  deadlineLbl: { fontSize: 12, marginTop: 2, fontWeight: "500" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  tapHint: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  emptyCard: {
    padding: 50,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    marginTop: 12,
  },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  fabText: { color: "#fff", fontSize: 32, fontWeight: "300", lineHeight: 36 },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 14,
    textAlign: "center",
  },
  lbl: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 5,
    marginTop: 10,
  },
  inp: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#fafcff",
    marginBottom: 2,
  },
  pChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  pChipTxt: { fontSize: 12, fontWeight: "600" },
  projChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: "#fafcff",
  },
  projChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  projChipTxt: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  selfBox: {
    backgroundColor: COLORS.accent + "18",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  selfTxt: { color: COLORS.primary, fontSize: 13, fontWeight: "500" },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnSubmit: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
});
