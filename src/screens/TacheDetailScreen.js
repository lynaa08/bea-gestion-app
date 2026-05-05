import React, { useEffect, useState, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { getTache, getSousTaches, createSousTache, toggleSousTache, deleteSousTache, updateTacheStatut } from "../api/api";
import { useTheme } from "../context/ThemeContext";

const STATUT_LABELS = { A_FAIRE: "À faire", EN_COURS: "En cours", TERMINEE: "Terminée", BLOQUEE: "Bloquée" };

function formatDate(dateStr) {
  if (!dateStr) return "";
  try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return dateStr; }
}

function getDeadlineInfo(dateEcheance, statut, C) {
  if (!dateEcheance || statut === "TERMINEE") return { color: C.success, iconName: "checkmark-circle", label: "Terminée" };
  const diff = Math.ceil((new Date(dateEcheance) - new Date()) / 86400000);
  if (diff < 0)  return { color: C.danger,  iconName: "ban",              label: `${Math.abs(diff)}j de retard` };
  if (diff === 0) return { color: C.danger,  iconName: "flame",            label: "Aujourd'hui !" };
  if (diff === 1) return { color: C.danger,  iconName: "warning",          label: "Demain !" };
  if (diff <= 3)  return { color: C.warning, iconName: "calendar-outline", label: `Dans ${diff} jours` };
  return            { color: C.success, iconName: "calendar-outline", label: `Dans ${diff} jours` };
}

export default function TacheDetailScreen({ route, navigation }) {
  const { C } = useTheme();
  const STATUT_COLORS = { A_FAIRE: C.muted, EN_COURS: C.warning, TERMINEE: C.success, BLOQUEE: C.danger };
  const { tacheId } = route.params;
  const [tache, setTache] = useState(null);
  const [sousTaches, setSousTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitre, setNewTitre] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [t, st] = await Promise.all([getTache(tacheId), getSousTaches(tacheId)]);
      setTache(t); setSousTaches(st);
      checkDeadline(t, C);
    } catch (e) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  }, [tacheId]);

  useEffect(() => { loadData(); }, [loadData]);

  const checkDeadline = (t, C) => {
    if (!t?.dateEcheance || t.statut === "TERMINEE") return;
    const echeance = new Date(t.dateEcheance);
    const diffMs = echeance - new Date();
    const diffDays = Math.ceil(diffMs / 86400000);
    if (diffMs < 0)       Alert.alert("Tâche en retard !",  `"${t.titre}" devait être terminée le ${formatDate(t.dateEcheance)}.`, [{ text: "Compris", style: "destructive" }]);
    else if (diffDays <= 1) Alert.alert("Deadline demain !",  `"${t.titre}" doit être terminée avant le ${formatDate(t.dateEcheance)}.`, [{ text: "OK" }]);
    else if (diffDays <= 3) Alert.alert("Deadline proche",    `"${t.titre}" doit être terminée dans ${diffDays} jours (${formatDate(t.dateEcheance)}).`, [{ text: "OK" }]);
  };

  const handleAdd = async () => {
    if (!newTitre.trim()) return;
    setAdding(true);
    try { const created = await createSousTache(tacheId, newTitre.trim()); setSousTaches((prev) => [...prev, created]); setNewTitre(""); }
    catch (e) { Alert.alert("Erreur", e.message); }
    finally { setAdding(false); }
  };

  const handleToggle = async (st) => {
    setSousTaches((prev) => prev.map((s) => (s.id === st.id ? { ...s, faite: !s.faite } : s)));
    try { await toggleSousTache(tacheId, st.id); }
    catch { setSousTaches((prev) => prev.map((s) => (s.id === st.id ? { ...s, faite: st.faite } : s))); }
  };

  const handleDelete = (st) => {
    Alert.alert("Supprimer", `Supprimer "${st.titre}" ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        setSousTaches((prev) => prev.filter((s) => s.id !== st.id));
        try { await deleteSousTache(tacheId, st.id); } catch {}
      }},
    ]);
  };

  const handleChangerStatut = () => {
    const options = Object.entries(STATUT_LABELS).filter(([key]) => key !== tache.statut).map(([key, label]) => ({
      text: label,
      onPress: async () => {
        try { const updated = await updateTacheStatut(tache.id, key); setTache(updated); }
        catch (e) { Alert.alert("Erreur", e.message); }
      },
    }));
    Alert.alert("Changer le statut", "Choisissez un statut :", [...options, { text: "Annuler", style: "cancel" }]);
  };

  const total = sousTaches.length;
  const faites = sousTaches.filter((s) => s.faite).length;
  const progress = total > 0 ? faites / total : 0;

  if (loading) return (
    <View style={[styles.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );

  if (!tache) return null;
  const statutColor = STATUT_COLORS[tache.statut] || C.muted;
  const deadlineInfo = getDeadlineInfo(tache.dateEcheance, tache.statut, C);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: statutColor }]}>
          <Text style={[styles.tacheTitre, { color: C.text }]}>{tache.titre}</Text>
          {tache.description ? <Text style={[styles.tacheDesc, { color: C.muted }]}>{tache.description}</Text> : null}

          <View style={styles.infoRow}>
            {/* Statut */}
            <TouchableOpacity style={[styles.statutBadge, { backgroundColor: statutColor + "22" }]} onPress={handleChangerStatut}>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: statutColor }}>{STATUT_LABELS[tache.statut]}</Text>
              <Ionicons name="chevron-down" size={13} color={statutColor} style={{ marginLeft: 3 }} />
            </TouchableOpacity>

            {/* Priorité */}
            {tache.priorite ? (
              <View style={[styles.prioriteBadge, { backgroundColor: C.warning + "22" }]}>
                <Ionicons name="flag-outline" size={12} color={C.warning} style={{ marginRight: 3 }} />
                <Text style={{ color: C.warning, fontSize: 12, fontWeight: "600" }}>{tache.priorite}</Text>
              </View>
            ) : null}
          </View>

          {/* Assigné */}
          {tache.assigneNom ? (
            <View style={[styles.rowItem, { marginBottom: 8 }]}>
              <Ionicons name="person-outline" size={14} color={C.muted} style={{ marginRight: 4 }} />
              <Text style={{ color: C.muted, fontSize: 13 }}>{tache.assignePrenom} {tache.assigneNom}</Text>
            </View>
          ) : null}

          {/* Deadline */}
          {tache.dateEcheance ? (
            <View style={[styles.deadlineBadge, { backgroundColor: deadlineInfo.color + "22" }]}>
              <Ionicons name={deadlineInfo.iconName} size={15} color={deadlineInfo.color} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: deadlineInfo.color }}>
                Deadline : {formatDate(tache.dateEcheance)}  ({deadlineInfo.label})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Progression */}
        {total > 0 && (
          <View style={[styles.progressSection, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={styles.progressHeader}>
              <View style={styles.rowItem}>
                <Ionicons name="bar-chart-outline" size={15} color={C.text} style={{ marginRight: 5 }} />
                <Text style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>Progression</Text>
              </View>
              <Text style={{ color: C.muted, fontSize: 13 }}>{faites}/{total} sous-tâches</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: C.border }]}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: progress === 1 ? C.success : C.accent }]} />
            </View>
            <Text style={{ color: C.muted, fontSize: 12, textAlign: "right", marginTop: 4 }}>{Math.round(progress * 100)}%</Text>
          </View>
        )}

        {/* Sous-tâches */}
        <View style={[styles.sousTachesSection, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.sectionTitleRow, { borderBottomColor: C.border }]}>
            <Ionicons name="list-outline" size={17} color={C.text} style={{ marginRight: 6 }} />
            <Text style={[styles.sectionTitle, { color: C.text }]}>Liste des tâches</Text>
          </View>

          {sousTaches.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={32} color={C.muted} style={{ marginBottom: 8 }} />
              <Text style={{ color: C.muted, fontSize: 14 }}>Aucune sous-tâche. Ajoutez-en ci-dessous.</Text>
            </View>
          ) : (
            sousTaches.map((st) => (
              <TouchableOpacity key={st.id}
                style={[styles.sousTacheRow, { borderBottomColor: C.border }, st.faite && { backgroundColor: C.sousTacheRowDone }]}
                onPress={() => handleToggle(st)} onLongPress={() => handleDelete(st)} activeOpacity={0.7}>

                {/* Checkbox */}
                <View style={[styles.checkbox, { borderColor: C.border }, st.faite && { backgroundColor: C.success, borderColor: C.success }]}>
                  {st.faite && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>

                <Text style={[{ flex: 1, fontSize: 14 }, st.faite ? { textDecorationLine: "line-through", color: C.muted } : { color: C.text }]}>
                  {st.titre}
                </Text>

                {/* Supprimer */}
                <TouchableOpacity onPress={() => handleDelete(st)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.deleteBtn}>
                  <Ionicons name="close-circle-outline" size={20} color={C.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>

      {/* Input bas */}
      <View style={[styles.inputBar, { backgroundColor: C.inputBar, borderTopColor: C.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.inputField, { borderColor: C.border, color: C.text, backgroundColor: C.bg }]}
          placeholder="Ajouter une sous-tâche..." placeholderTextColor={C.muted}
          value={newTitre} onChangeText={setNewTitre} onSubmitEditing={handleAdd} returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: !newTitre.trim() ? C.muted : C.primary }]}
          onPress={handleAdd} disabled={adding || !newTitre.trim()}>
          {adding
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="add" size={26} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, borderBottomWidth: 3, marginBottom: 8 },
  tacheTitre: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  tacheDesc: { fontSize: 14, marginBottom: 12, lineHeight: 20 },
  infoRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  rowItem: { flexDirection: "row", alignItems: "center" },
  statutBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  prioriteBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  deadlineBadge: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 10, marginTop: 4 },
  progressSection: { margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, borderWidth: 1 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressBar: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  sousTachesSection: { margin: 12, marginBottom: 0, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1 },
  sectionTitle: { fontWeight: "bold", fontSize: 15 },
  emptyBox: { padding: 24, alignItems: "center" },
  sousTacheRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  deleteBtn: { padding: 4 },
  inputBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", borderTopWidth: 1, padding: 12, gap: 10, elevation: 8 },
  inputField: { flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
  addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});