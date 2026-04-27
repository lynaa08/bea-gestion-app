import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { getMesTaches, createTache, getProjets } from "../api/api";
import { useAuth, canCreateTache, ROLES, hasRole } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const STATUT_LABELS = { A_FAIRE: "À faire", EN_COURS: "En cours", TERMINEE: "Terminée", BLOQUEE: "Bloquée" };
const FILTERS = ["Tous", "A_FAIRE", "EN_COURS", "TERMINEE", "BLOQUEE"];

function getDeadlineInfo(dateEcheance, statut, C) {
  if (!dateEcheance || statut === "TERMINEE") return { color: C.muted, icon: "", label: "" };
  const diff = Math.ceil((new Date(dateEcheance) - new Date()) / 86400000);
  if (diff < 0) return { color: C.danger, icon: "⛔", label: `${Math.abs(diff)}j retard` };
  if (diff === 0) return { color: C.danger, icon: "🔥", label: "Aujourd'hui !" };
  if (diff === 1) return { color: C.danger, icon: "⚠️", label: "Demain !" };
  if (diff <= 3) return { color: C.warning, icon: "📅", label: `${diff}j restants` };
  return { color: C.muted, icon: "📅", label: `${diff}j restants` };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return dateStr; }
}

export default function TachesScreen({ navigation }) {
  const { C } = useTheme();
  const STATUT_COLORS = { A_FAIRE: C.muted, EN_COURS: C.warning, TERMINEE: C.success, BLOQUEE: C.danger };
  const { user } = useAuth();
  const canCreate = canCreateTache(user);
  const isDev = hasRole(user, ROLES.DEV);

  const [taches, setTaches] = useState([]);
  const [filtre, setFiltre] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [projets, setProjets] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", priorite: "MOYENNE", dateEcheance: "", projetId: null });

  const loadTaches = useCallback(async () => {
    try { const data = await getMesTaches(); setTaches(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadTaches(); }, [loadTaches]);
  const onRefresh = () => { setRefreshing(true); loadTaches(); };

  const handleDateChange = (val) => {
    const clean = val.replace(/[^\d/]/g, "");
    const digits = clean.replace(/\//g, "").substring(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    setForm((f) => ({ ...f, dateEcheance: formatted }));
  };

  const openModal = async () => {
    setForm({ titre: "", description: "", priorite: "MOYENNE", dateEcheance: "", projetId: null });
    try { const p = await getProjets(); setProjets(p || []); } catch { setProjets([]); }
    setShowModal(true);
  };

  const submitCreate = async () => {
    if (!form.titre.trim()) { Alert.alert("Erreur", "Le titre est obligatoire."); return; }
    if (!form.projetId) { Alert.alert("Erreur", "Sélectionnez un projet."); return; }
    let dateForBackend = null;
    if (form.dateEcheance && form.dateEcheance.length === 10) {
      const parts = form.dateEcheance.split("/");
      if (parts.length === 3) dateForBackend = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    setCreating(true);
    try {
      await createTache({ titre: form.titre.trim(), description: form.description || null, priorite: form.priorite, dateEcheance: dateForBackend, projetId: form.projetId, assigneMatricule: isDev ? user?.matricule : null });
      setShowModal(false);
      Alert.alert("✅ Créée", "Tâche créée avec succès !");
      loadTaches();
    } catch (e) { Alert.alert("Erreur", e.message || "Impossible de créer la tâche."); }
    finally { setCreating(false); }
  };

  const filtered = filtre === "Tous" ? taches : taches.filter((t) => t.statut === filtre);
  const stats = {
    total: taches.length, faites: taches.filter((t) => t.statut === "TERMINEE").length,
    enCours: taches.filter((t) => t.statut === "EN_COURS").length, aFaire: taches.filter((t) => t.statut === "A_FAIRE").length,
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: C.statsRow, borderBottomColor: C.border }]}>
        {[["Total", stats.total, C.primary], ["À faire", stats.aFaire, C.muted], ["En cours", stats.enCours, C.warning], ["Faites", stats.faites, C.success]].map(([label, value, color]) => (
          <View key={label} style={[styles.statBox, { borderTopColor: color }]}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Filtres */}
      <FlatList
        data={FILTERS} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(s) => s}
        style={[styles.filtersBar, { backgroundColor: C.filtersBar, borderBottomColor: C.border }]}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.filterChip, { borderColor: C.border, backgroundColor: C.bg }, filtre === s && { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={() => setFiltre(s)}>
            <Text style={[{ fontSize: 13, color: C.muted }, filtre === s && { color: "#fff", fontWeight: "600" }]}>
              {s === "Tous" ? "Tous" : STATUT_LABELS[s]}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Liste */}
      <FlatList
        data={filtered} keyExtractor={(t) => String(t.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <MaterialIcons name="assignment" size={56} color={C.border} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>Aucune tâche</Text>
            <Text style={{ color: C.muted, fontSize: 14, textAlign: "center" }}>
              {filtre === "Tous" ? "Vous n'avez pas de tâches assignées." : `Aucune tâche "${STATUT_LABELS[filtre]}".`}
            </Text>
          </View>
        }
        renderItem={({ item: t }) => {
          const isDone = t.statut === "TERMINEE";
          const color = STATUT_COLORS[t.statut] || C.muted;
          const deadlineInfo = getDeadlineInfo(t.dateEcheance, t.statut, C);
          return (
            <TouchableOpacity
              style={[styles.tacheCard, { backgroundColor: C.card, borderColor: C.border, borderLeftColor: color }]}
              onPress={() => navigation.navigate("TacheDetail", { tacheId: t.id })} activeOpacity={0.75}>
              <View style={[styles.checkbox, { borderColor: C.border }, isDone && { backgroundColor: C.success, borderColor: C.success }]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontWeight: "600", fontSize: 14, marginBottom: 3 }, isDone ? { textDecorationLine: "line-through", color: C.muted } : { color: C.text }]}>{t.titre}</Text>
                {t.projetNom ? <Text style={{ color: C.accent, fontSize: 12 }}><MaterialIcons name="folder" size={12} color={C.accent} /> {t.projetNom}</Text> : null}
                <Text style={{ color: C.muted, fontSize: 12 }}><MaterialIcons name="person" size={12} color={C.muted} /> {t.assignePrenom} {t.assigneNom || "Non assigné"}</Text>
                {t.dateEcheance ? <Text style={{ fontSize: 12, marginTop: 2, fontWeight: "500", color: deadlineInfo.color }}>{deadlineInfo.icon} {formatDate(t.dateEcheance)} · {deadlineInfo.label}</Text> : null}
              </View>
              <View style={{ gap: 4, alignItems: "flex-end" }}>
                <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color }}>{STATUT_LABELS[t.statut] || t.statut}</Text>
                </View>
                <Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>Tap pour détails ›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {canCreate && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={openModal} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: C.modalBox }]}>
            <Text style={[styles.modalTitle, { color: C.primary }]}>➕ Nouvelle tâche</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.lbl, { color: C.muted }]}>Titre *</Text>
              <TextInput style={[styles.inp, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Titre de la tâche..." placeholderTextColor={C.muted} value={form.titre} onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))} />
              <Text style={[styles.lbl, { color: C.muted }]}>Description</Text>
              <TextInput style={[styles.inp, { height: 70, borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Description..." placeholderTextColor={C.muted} multiline value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} />
              <Text style={[styles.lbl, { color: C.muted }]}>Priorité</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                {["BASSE", "MOYENNE", "HAUTE"].map((p) => (
                  <TouchableOpacity key={p} style={[styles.pChip, { borderColor: C.border }, form.priorite === p && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setForm((f) => ({ ...f, priorite: p }))}>
                    <Text style={[{ fontSize: 12, fontWeight: "600", color: C.muted }, form.priorite === p && { color: "#fff" }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.lbl, { color: C.muted }]}>Date d'échéance</Text>
              <TextInput style={[styles.inp, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="JJ/MM/AAAA" placeholderTextColor={C.muted} value={form.dateEcheance} onChangeText={handleDateChange} keyboardType="default" maxLength={10} />
              <Text style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Format : JJ/MM/AAAA — les / s'ajoutent automatiquement</Text>
              <Text style={[styles.lbl, { color: C.muted }]}>Projet *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {projets.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.projChip, { borderColor: C.border, backgroundColor: C.inputBg }, form.projetId === p.id && { backgroundColor: C.accent, borderColor: C.accent }]} onPress={() => setForm((f) => ({ ...f, projetId: p.id }))}>
                    <Text style={[{ fontSize: 13, fontWeight: "500", color: C.text }, form.projetId === p.id && { color: "#fff" }]}>{p.nom}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {isDev && (
                <View style={[styles.selfBox, { backgroundColor: C.accent + "18" }]}>
                  <Text style={{ color: C.primary, fontSize: 13, fontWeight: "500" }}>👤 Tâche assignée à vous automatiquement</Text>
                </View>
              )}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 14 }}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: C.border }]} onPress={() => setShowModal(false)}>
                <Text style={{ color: C.muted, fontWeight: "600" }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSubmit, { backgroundColor: C.primary }, creating && { opacity: 0.6 }]} onPress={submitCreate} disabled={creating}>
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{creating ? "Création..." : "✓ Créer"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsRow: { flexDirection: "row", borderBottomWidth: 1 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 12, borderTopWidth: 3 },
  statValue: { fontSize: 20, fontWeight: "bold" },
  statLabel: { fontSize: 11, marginTop: 2 },
  filtersBar: { paddingVertical: 10, borderBottomWidth: 1, maxHeight: 52 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tacheCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderLeftWidth: 4, gap: 12 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  checkmark: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  emptyCard: { padding: 50, alignItems: "center", borderRadius: 16, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, marginTop: 12 },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6 },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "300", lineHeight: 34 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  modalBox: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: "88%" },
  modalTitle: { fontSize: 17, fontWeight: "bold", marginBottom: 14, textAlign: "center" },
  lbl: { fontSize: 12, fontWeight: "600", marginBottom: 5, marginTop: 10 },
  inp: { borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 14, marginBottom: 2 },
  pChip: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  projChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, marginRight: 8 },
  selfBox: { borderRadius: 10, padding: 10, marginTop: 4 },
  btnCancel: { flex: 1, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  btnSubmit: { flex: 2, paddingVertical: 13, borderRadius: 10, alignItems: "center" },
});
