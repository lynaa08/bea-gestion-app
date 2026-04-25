import React, { useEffect, useState, useCallback, useRef } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  getTache,
  getSousTaches,
  createSousTache,
  toggleSousTache,
  deleteSousTache,
  updateTacheStatut,
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

const STATUT_COLORS = {
  A_FAIRE: COLORS.muted,
  EN_COURS: COLORS.warning,
  TERMINEE: COLORS.success,
  BLOQUEE: COLORS.danger,
};
const STATUT_LABELS = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  BLOQUEE: "Bloquée",
};

export default function TacheDetailScreen({ route, navigation }) {
  const { tacheId } = route.params;
  const [tache, setTache] = useState(null);
  const [sousTaches, setSousTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitre, setNewTitre] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  // ── Charger la tâche + ses sous-tâches ───────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [t, st] = await Promise.all([
        getTache(tacheId),
        getSousTaches(tacheId),
      ]);
      setTache(t);
      setSousTaches(st);

      // ✅ Vérifier la deadline au chargement
      checkDeadline(t);
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  }, [tacheId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Alerte deadline ──────────────────────────────────────────────────────
  const checkDeadline = (t) => {
    if (!t?.dateEcheance || t.statut === "TERMINEE") return;

    const echeance = new Date(t.dateEcheance);
    const now = new Date();
    const diffMs = echeance - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      // ✅ Tâche en retard
      Alert.alert(
        "⛔ Tâche en retard !",
        `"${t.titre}" devait être terminée le ${formatDate(t.dateEcheance)}.\n\nVeuillez la compléter dès que possible.`,
        [{ text: "Compris", style: "destructive" }],
      );
    } else if (diffDays <= 1) {
      // ✅ Deadline dans moins de 24h
      Alert.alert(
        "⚠️ Deadline demain !",
        `"${t.titre}" doit être terminée avant le ${formatDate(t.dateEcheance)}.`,
        [{ text: "OK" }],
      );
    } else if (diffDays <= 3) {
      // ✅ Deadline dans 2-3 jours
      Alert.alert(
        "📅 Deadline proche",
        `"${t.titre}" doit être terminée dans ${diffDays} jours (${formatDate(t.dateEcheance)}).`,
        [{ text: "OK" }],
      );
    }
  };

  // ── Ajouter une sous-tâche ───────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newTitre.trim()) return;
    setAdding(true);
    try {
      const created = await createSousTache(tacheId, newTitre.trim());
      setSousTaches((prev) => [...prev, created]);
      setNewTitre("");
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setAdding(false);
    }
  };

  // ── Toggler une sous-tâche ───────────────────────────────────────────────
  const handleToggle = async (st) => {
    // Optimistic update
    setSousTaches((prev) =>
      prev.map((s) => (s.id === st.id ? { ...s, faite: !s.faite } : s)),
    );
    try {
      await toggleSousTache(tacheId, st.id);
    } catch {
      // Rollback
      setSousTaches((prev) =>
        prev.map((s) => (s.id === st.id ? { ...s, faite: st.faite } : s)),
      );
    }
  };

  // ── Supprimer une sous-tâche ─────────────────────────────────────────────
  const handleDelete = (st) => {
    Alert.alert("Supprimer", `Supprimer "${st.titre}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setSousTaches((prev) => prev.filter((s) => s.id !== st.id));
          try {
            await deleteSousTache(tacheId, st.id);
          } catch {}
        },
      },
    ]);
  };

  // ── Changer le statut de la tâche ────────────────────────────────────────
  const handleChangerStatut = () => {
    const options = Object.entries(STATUT_LABELS)
      .filter(([key]) => key !== tache.statut)
      .map(([key, label]) => ({
        text: label,
        onPress: async () => {
          try {
            const updated = await updateTacheStatut(tache.id, key);
            setTache(updated);
          } catch (e) {
            Alert.alert("Erreur", e.message);
          }
        },
      }));

    Alert.alert("Changer le statut", "Choisissez un statut :", [
      ...options,
      { text: "Annuler", style: "cancel" },
    ]);
  };

  // ── Calcul progression ───────────────────────────────────────────────────
  const total = sousTaches.length;
  const faites = sousTaches.filter((s) => s.faite).length;
  const progress = total > 0 ? faites / total : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!tache) return null;

  const statutColor = STATUT_COLORS[tache.statut] || COLORS.muted;
  const deadlineInfo = getDeadlineInfo(tache.dateEcheance, tache.statut);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ── Header tâche ── */}
        <View style={[styles.header, { borderBottomColor: statutColor }]}>
          <Text style={styles.tacheTitre}>{tache.titre}</Text>
          {tache.description ? (
            <Text style={styles.tacheDesc}>{tache.description}</Text>
          ) : null}

          {/* Infos */}
          <View style={styles.infoRow}>
            {/* Statut — tappable pour changer */}
            <TouchableOpacity
              style={[
                styles.statutBadge,
                { backgroundColor: statutColor + "22" },
              ]}
              onPress={handleChangerStatut}>
              <Text style={[styles.statutText, { color: statutColor }]}>
                {STATUT_LABELS[tache.statut]} ▾
              </Text>
            </TouchableOpacity>

            {/* Priorité */}
            {tache.priorite ? (
              <View style={styles.prioriteBadge}>
                <Text style={styles.prioriteText}>{tache.priorite}</Text>
              </View>
            ) : null}
          </View>

          {/* Assigné */}
          {tache.assigneNom ? (
            <Text style={styles.assigneText}>
              <MaterialIcons name="person" size={12} color="#8A9FBF" />{" "}
              {tache.assignePrenom} {tache.assigneNom}
            </Text>
          ) : null}

          {/* Deadline avec couleur selon urgence */}
          {tache.dateEcheance ? (
            <View
              style={[
                styles.deadlineBadge,
                { backgroundColor: deadlineInfo.color + "22" },
              ]}>
              <Text
                style={[styles.deadlineText, { color: deadlineInfo.color }]}>
                {deadlineInfo.icon} Deadline : {formatDate(tache.dateEcheance)}
                {"  "}({deadlineInfo.label})
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Barre de progression ── */}
        {total > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressCount}>
                {faites}/{total} sous-tâches
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor:
                      progress === 1 ? COLORS.success : COLORS.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPct}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        {/* ── Liste des sous-tâches ── */}
        <View style={styles.sousTachesSection}>
          <Text style={styles.sectionTitle}>📝 Liste des tâches</Text>

          {sousTaches.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Aucune sous-tâche. Ajoutez-en ci-dessous.
              </Text>
            </View>
          ) : (
            sousTaches.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={[
                  styles.sousTacheRow,
                  st.faite && styles.sousTacheRowDone,
                ]}
                onPress={() => handleToggle(st)}
                onLongPress={() => handleDelete(st)}
                activeOpacity={0.7}>
                {/* Checkbox */}
                <View
                  style={[styles.checkbox, st.faite && styles.checkboxDone]}>
                  {st.faite && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <Text style={[styles.sousTacheTitre, st.faite && styles.done]}>
                  {st.titre}
                </Text>

                {/* Bouton supprimer */}
                <TouchableOpacity
                  onPress={() => handleDelete(st)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Input ajouter sous-tâche (fixé en bas) ── */}
      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          style={styles.inputField}
          placeholder="Ajouter une sous-tâche..."
          placeholderTextColor={COLORS.muted}
          value={newTitre}
          onChangeText={setNewTitre}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, !newTitre.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={adding || !newTitre.trim()}>
          {adding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>+</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
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
  if (!dateEcheance || statut === "TERMINEE") {
    return { color: COLORS.success, icon: "✅", label: "Terminée" };
  }
  const diff = Math.ceil((new Date(dateEcheance) - new Date()) / 86400000);
  if (diff < 0)
    return {
      color: COLORS.danger,
      icon: "⛔",
      label: `${Math.abs(diff)}j de retard`,
    };
  if (diff === 0)
    return { color: COLORS.danger, icon: "🔥", label: "Aujourd'hui !" };
  if (diff === 1)
    return { color: COLORS.danger, icon: "⚠️", label: "Demain !" };
  if (diff <= 3)
    return { color: COLORS.warning, icon: "📅", label: `Dans ${diff} jours` };
  return { color: COLORS.success, icon: "📅", label: `Dans ${diff} jours` };
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: COLORS.card,
    padding: 20,
    borderBottomWidth: 3,
    marginBottom: 8,
  },
  tacheTitre: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  tacheDesc: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statutText: { fontSize: 13, fontWeight: "bold" },
  prioriteBadge: {
    backgroundColor: COLORS.warning + "22",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  prioriteText: { color: COLORS.warning, fontSize: 12, fontWeight: "600" },
  assigneText: { color: COLORS.muted, fontSize: 13, marginBottom: 8 },
  deadlineBadge: {
    padding: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  deadlineText: { fontSize: 13, fontWeight: "600" },

  progressSection: {
    backgroundColor: COLORS.card,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  progressCount: { color: COLORS.muted, fontSize: 13 },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 5 },
  progressPct: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },

  sousTachesSection: {
    margin: 12,
    marginBottom: 0,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  sectionTitle: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 15,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  emptyBox: { padding: 24, alignItems: "center" },
  emptyText: { color: COLORS.muted, fontSize: 14 },

  sousTacheRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  sousTacheRowDone: { backgroundColor: "#F8FFF8" },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  sousTacheTitre: { flex: 1, color: COLORS.text, fontSize: 14 },
  done: { textDecorationLine: "line-through", color: COLORS.muted },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: COLORS.muted, fontSize: 16 },

  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    gap: 10,
    elevation: 8,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnDisabled: { backgroundColor: COLORS.muted },
  addBtnText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "300",
  },
});
