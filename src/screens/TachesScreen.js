import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  useAuth,
  ROLES,
  hasRole,
  canCreateTache,
} from "../context/AuthContext";
import {
  getMesTaches,
  updateTacheStatut,
  createTache,
  getProjets,
} from "../api/api";

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

export default function TachesScreen() {
  const { user } = useAuth();
  const isDev = hasRole(user, ROLES.DEV);
  const canCreate = canCreateTache(user);

  const [taches, setTaches] = useState([]);
  const [filtre, setFiltre] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Modal création ──
  const [showCreate, setShowCreate] = useState(false);
  const [projets, setProjets] = useState([]);
  const [form, setForm] = useState({
    titre: "",
    description: "",
    priorite: "MOYENNE",
    dateEcheance: "",
    projetId: null,
    assigneMatricule: "",
  });
  const [creating, setCreating] = useState(false);

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

  // Ouvrir modal + charger projets
  const openCreate = async () => {
    setForm({
      titre: "",
      description: "",
      priorite: "MOYENNE",
      dateEcheance: "",
      projetId: null,
      assigneMatricule: "",
    });
    try {
      const p = await getProjets();
      setProjets(p);
    } catch (e) {}
    setShowCreate(true);
  };

  const submitCreate = async () => {
    if (!form.titre.trim()) {
      Alert.alert("Erreur", "Le titre est obligatoire.");
      return;
    }
    if (!form.projetId) {
      Alert.alert("Erreur", "Sélectionnez un projet.");
      return;
    }
    setCreating(true);
    try {
      const body = {
        titre: form.titre.trim(),
        description: form.description || null,
        priorite: form.priorite || "MOYENNE",
        dateEcheance: form.dateEcheance || null,
        projetId: form.projetId,
        // DEV crée la tâche pour lui-même
        assigneMatricule: isDev
          ? user.matricule
          : form.assigneMatricule || null,
      };
      await createTache(body);
      setShowCreate(false);
      Alert.alert("✅ Tâche créée", "Votre tâche a été créée avec succès.");
      loadTaches();
    } catch (e) {
      Alert.alert("Erreur", e.message || "Impossible de créer la tâche.");
    } finally {
      setCreating(false);
    }
  };

  // ── Tap sur tâche pour changer statut ──
  const handleTapTache = (tache) => {
    if (tache.statut === "TERMINEE") {
      Alert.alert("Tâche terminée", "Cette tâche est déjà terminée.", [
        { text: "Annuler", style: "cancel" },
        { text: "Rouvrir", onPress: () => changerStatut(tache, "A_FAIRE") },
      ]);
      return;
    }
    Alert.alert("Marquer comme faite ?", `"${tache.titre}"`, [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, c'est fait ✓",
        onPress: () => changerStatut(tache, "TERMINEE"),
      },
    ]);
  };

  const changerStatut = async (tache, newStatut) => {
    setTaches((prev) =>
      prev.map((t) => (t.id === tache.id ? { ...t, statut: newStatut } : t)),
    );
    try {
      await updateTacheStatut(tache.id, newStatut);
    } catch (e) {
      setTaches((prev) =>
        prev.map((t) =>
          t.id === tache.id ? { ...t, statut: tache.statut } : t,
        ),
      );
      Alert.alert("Erreur", "Impossible de mettre à jour la tâche.");
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

      {/* ── Bouton créer tâche (visible si canCreateTache) ── */}
      {canCreate && (
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Text style={styles.createBtnText}>+ Nouvelle tâche</Text>
        </TouchableOpacity>
      )}

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
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune tâche</Text>
            <Text style={styles.emptyText}>
              {filtre === "Tous"
                ? "Vous n'avez pas encore de tâches assignées."
                : `Aucune tâche "${STATUT_LABELS[filtre]}".`}
            </Text>
            {canCreate && (
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={openCreate}>
                <Text style={styles.emptyCreateText}>Créer une tâche</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item: t }) => {
          const isDone = t.statut === "TERMINEE";
          const color = STATUT_COLORS[t.statut] || COLORS.muted;
          return (
            <TouchableOpacity
              style={[styles.tacheCard, { borderLeftColor: color }]}
              onPress={() => handleTapTache(t)}
              activeOpacity={0.75}>
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tacheTitre, isDone && styles.done]}>
                  {t.titre}
                </Text>
                {t.description ? (
                  <Text style={styles.tacheDesc} numberOfLines={1}>
                    {t.description}
                  </Text>
                ) : null}
                {t.projetNom ? (
                  <Text style={styles.projetLabel}>📁 {t.projetNom}</Text>
                ) : null}
                {t.dateEcheance ? (
                  <Text style={styles.dateLbl}>📅 {t.dateEcheance}</Text>
                ) : null}
              </View>
              <View style={{ gap: 4, alignItems: "flex-end" }}>
                <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.badgeText, { color }]}>
                    {STATUT_LABELS[t.statut] || t.statut}
                  </Text>
                </View>
                {t.priorite ? (
                  <Text style={styles.prioriteText}>{t.priorite}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Modal création de tâche ── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>➕ Nouvelle tâche</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Titre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de la tâche..."
                value={form.titre}
                onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Description (optionnel)..."
                multiline
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              />

              <Text style={styles.label}>Priorité</Text>
              <View style={styles.prioriteRow}>
                {["BASSE", "MOYENNE", "HAUTE"].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.prioriteChip,
                      form.priorite === p && styles.prioriteChipActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, priorite: p }))}>
                    <Text
                      style={[
                        styles.prioriteChipText,
                        form.priorite === p && { color: "#fff" },
                      ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Date d'échéance (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-31"
                value={form.dateEcheance}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, dateEcheance: v }))
                }
              />

              <Text style={styles.label}>Projet *</Text>
              {projets.length === 0 ? (
                <Text style={styles.noData}>Aucun projet disponible</Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 10 }}>
                  {projets.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.projetChip,
                        form.projetId === p.id && styles.projetChipActive,
                      ]}
                      onPress={() =>
                        setForm((f) => ({ ...f, projetId: p.id }))
                      }>
                      <Text
                        style={[
                          styles.projetChipText,
                          form.projetId === p.id && { color: "#fff" },
                        ]}>
                        {p.nom}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Pour DEV : assigné = lui-même (auto) */}
              {isDev && (
                <View style={styles.selfAssignInfo}>
                  <Text style={styles.selfAssignText}>
                    👤 Cette tâche vous sera assignée automatiquement
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowCreate(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSubmit, creating && { opacity: 0.6 }]}
                onPress={submitCreate}
                disabled={creating}>
                <Text style={styles.btnSubmitText}>
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

  createBtn: {
    backgroundColor: COLORS.primary,
    margin: 12,
    marginBottom: 4,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

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
  tacheDesc: { color: COLORS.muted, fontSize: 12, marginBottom: 3 },
  projetLabel: { color: COLORS.accent, fontSize: 12 },
  dateLbl: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  prioriteText: { color: COLORS.muted, fontSize: 11 },

  emptyCard: {
    padding: 50,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  emptyCreateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCreateText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    backgroundColor: "#fafcff",
  },
  prioriteRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  prioriteChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  prioriteChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  prioriteChipText: { fontSize: 13, fontWeight: "600", color: COLORS.muted },
  projetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: "#fafcff",
  },
  projetChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  projetChipText: { fontSize: 13, color: COLORS.text, fontWeight: "500" },
  selfAssignInfo: {
    backgroundColor: COLORS.accent + "18",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  selfAssignText: { color: COLORS.primary, fontSize: 13, fontWeight: "500" },
  noData: {
    color: COLORS.muted,
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnCancelText: { color: COLORS.muted, fontWeight: "600", fontSize: 14 },
  btnSubmit: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  btnSubmitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
