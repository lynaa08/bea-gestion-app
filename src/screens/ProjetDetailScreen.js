import React, { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useAuth, canCreateTache } from "../context/AuthContext";
import { getProjet, getTachesProjet, createTache, getDevelopeurs, updateTacheStatut } from "../api/api";
import { useTheme } from "../context/ThemeContext";

const STATUT_TACHE_LABELS = { A_FAIRE: "À faire", EN_COURS: "En cours", TERMINEE: "Terminée", BLOQUEE: "Bloquée" };

function toISO(str) {
  if (!str || !str.trim()) return null;
  const clean = str.trim().replace(/\//g, "-");
  const parts = clean.split("-");
  if (parts.length !== 3) return null;
  const [a, b, c] = parts;
  if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
  return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
}

export default function ProjetDetailScreen({ route, navigation }) {
  const { C } = useTheme();
  const STATUT_TACHE = {
    A_FAIRE: { label: "À faire", color: C.muted },
    EN_COURS: { label: "En cours", color: C.warning },
    TERMINEE: { label: "Terminée", color: C.success },
    BLOQUEE: { label: "Bloquée", color: C.danger },
  };
  const { projetId } = route.params;
  const { user } = useAuth();
  const [projet, setProjet] = useState(null);
  const [taches, setTaches] = useState([]);
  const [devs, setDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitre, setFormTitre] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDev, setFormDev] = useState(null);
  const [formDate, setFormDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([getProjet(projetId), getTachesProjet(projetId)]);
      setProjet(p); setTaches(t);
      if (canCreateTache(user)) { const d = await getDevelopeurs(); setDevs(d); }
    } catch (e) { Alert.alert("Erreur", e.message); }
    finally { setLoading(false); }
  }, [projetId, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateTache = async () => {
    if (!formTitre.trim()) { Alert.alert("Titre requis", "Veuillez saisir le titre de la tâche."); return; }
    const dateISO = toISO(formDate);
    if (formDate.trim() && !dateISO) { Alert.alert("Date invalide", "Format attendu : JJ/MM/AAAA\nExemple : 30/06/2026"); return; }
    setSaving(true);
    try {
      await createTache({ titre: formTitre.trim(), description: formDesc.trim(), projetId, assigneMatricule: formDev?.matricule || null, dateEcheance: dateISO });
      setFormTitre(""); setFormDesc(""); setFormDev(null); setFormDate(""); setModalVisible(false);
      Alert.alert("Tâche créée", `"${formTitre}" a été ajoutée au projet.`);
      await loadData();
    } catch (e) { Alert.alert("Erreur", e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );

  if (!projet) return null;
  const peutCreer = canCreateTache(user);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.nomBox, { backgroundColor: C.primary }]}>
          <Text style={styles.nomProjet}>{projet.nom}</Text>
          <View style={[styles.statutBadge, { backgroundColor: C.accent + "33" }]}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.accent }}>{projet.statut || "N/A"}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          {projet.matricule ? <Row label="Matricule" value={projet.matricule} C={C} /> : null}
          {projet.etat ? <Row label="État" value={projet.etat} C={C} /> : null}
          {projet.type ? <Row label="Type" value={projet.type} C={C} /> : null}
          {projet.description ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 13 }}>Description</Text>
              <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, marginTop: 4 }}>{projet.description}</Text>
            </View>
          ) : null}
        </View>

        {projet.equipe?.length > 0 && (
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            {/* 👥 remplacé par Ionicons */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Ionicons name="people" size={18} color={C.text} />
              <Text style={{ color: C.text, fontWeight: "bold", fontSize: 15 }}>Équipe</Text>
            </View>
            {projet.equipe.map((m, i) => (
              <View key={m.matricule || i} style={[styles.membreRow, { borderTopColor: C.border }]}>
                <View style={[styles.membreAvatar, { backgroundColor: C.accent + "44" }]}>
                  <Text style={{ color: C.primary, fontWeight: "bold", fontSize: 13 }}>{(m.prenom?.[0] || "") + (m.nom?.[0] || "")}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontWeight: "600", fontSize: 14 }}>{m.prenom} {m.nom}</Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>{m.matricule}</Text>
                </View>
                <View style={[styles.roleChip, { backgroundColor: C.primary + "22" }]}>
                  <Text style={{ color: C.primary, fontSize: 11, fontWeight: "600" }}>{m.role || "DEV"}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tachesHeader}>
          {/* 📋 remplacé par Ionicons */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="clipboard-outline" size={18} color={C.text} />
            <Text style={{ color: C.text, fontWeight: "bold", fontSize: 15 }}>Tâches ({taches.length})</Text>
          </View>
        </View>

        {taches.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={{ color: C.muted, fontSize: 14 }}>Aucune tâche pour ce projet</Text>
          </View>
        ) : (
          <View style={styles.tachesGrid}>
            {taches.map((t) => {
              const st = STATUT_TACHE[t.statut] || STATUT_TACHE.A_FAIRE;
              const isDone = t.statut === "TERMINEE";
              return (
                <TouchableOpacity key={t.id}
                  style={[styles.tacheCard, { backgroundColor: C.card, borderColor: C.border }, isDone && { opacity: 0.6 }]}
                  onPress={() => navigation.navigate("TacheDetail", { tacheId: t.id })} activeOpacity={0.8}>
                  <View style={[styles.tacheStatutDot, { backgroundColor: st.color }]} />
                  <Text style={[{ color: C.text, fontWeight: "600", fontSize: 13, marginBottom: 4 }, isDone && { textDecorationLine: "line-through", color: C.muted }]}>{t.titre}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>{t.assignePrenom || ""} {t.assigneNom || "—"}</Text>
                  <View style={[styles.tacheBadge, { backgroundColor: st.color + "22" }]}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: st.color }}>{st.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {peutCreer && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          {/* + remplacé par Ionicons */}
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.modalBox }]}>
            <View style={[styles.handle, { backgroundColor: C.border }]} />
            <Text style={[styles.modalTitle, { color: C.text }]}>Nouvelle tâche</Text>
            <Text style={[styles.inputLabel, { color: C.muted }]}>Titre *</Text>
            <TextInput style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Titre de la tâche" placeholderTextColor={C.muted} value={formTitre} onChangeText={setFormTitre} />
            <Text style={[styles.inputLabel, { color: C.muted }]}>Description</Text>
            <TextInput style={[styles.input, { height: 70, textAlignVertical: "top", borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Description (optionnel)" placeholderTextColor={C.muted} value={formDesc} onChangeText={setFormDesc} multiline />
            <Text style={[styles.inputLabel, { color: C.muted }]}>Assigner à (Développeur)</Text>
            <ScrollView style={styles.devList} horizontal showsHorizontalScrollIndicator={false}>
              {devs.map((d) => (
                <TouchableOpacity key={d.matricule}
                  style={[styles.devChip, { borderColor: C.border, backgroundColor: C.bg }, formDev?.matricule === d.matricule && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setFormDev(formDev?.matricule === d.matricule ? null : d)}>
                  <Text style={[{ fontSize: 13 }, formDev?.matricule === d.matricule ? { color: "#fff" } : { color: C.text }]}>{d.prenom} {d.nom}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.lbl, { color: C.muted }]}>Date d'échéance</Text>
            <TextInput
              style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={C.muted}
              value={formDate}
              onChangeText={(val) => {
                if (val.length < formDate.length) { setFormDate(val); return; }
                const digits = val.replace(/\D/g, "").substring(0, 8);
                let f = digits;
                if (digits.length > 2) f = digits.slice(0, 2) + "/" + digits.slice(2);
                if (digits.length > 4) f = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
                setFormDate(f);
              }}
              keyboardType="number-pad"
              maxLength={10}
            />
            <Text style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Format : JJ/MM/AAAA — les / s'ajoutent automatiquement</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: C.border }]} onPress={() => { setModalVisible(false); setFormTitre(""); setFormDesc(""); setFormDev(null); setFormDate(""); }}>
                {/* Bouton Annuler avec icône */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="close-circle-outline" size={18} color={C.muted} />
                  <Text style={{ color: C.muted, fontWeight: "600" }}>Annuler</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, { backgroundColor: C.primary }]} onPress={handleCreateTache} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  /* Bouton Créer avec icône */
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 15 }}>Créer</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value, C }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
      <Text style={{ color: C.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 13, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  nomBox: { padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nomProjet: { color: "#fff", fontSize: 20, fontWeight: "bold", flex: 1 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  card: { margin: 12, marginBottom: 0, borderRadius: 12, padding: 14, borderWidth: 1 },
  membreRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, gap: 10 },
  membreAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  roleChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tachesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 12, marginTop: 16, marginBottom: 8 },
  tachesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  tacheCard: { width: "47%", margin: "1.5%", borderRadius: 12, padding: 12, borderWidth: 1 },
  tacheStatutDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  tacheBadge: { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  emptyCard: { margin: 12, padding: 24, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, justifyContent: "center", alignItems: "center", elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  inputLabel: { fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  devList: { marginVertical: 4, maxHeight: 48 },
  devChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  lbl: { fontSize: 13, marginBottom: 4, marginTop: 12 },
});