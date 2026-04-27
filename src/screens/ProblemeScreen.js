import React, { useEffect, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  Modal, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { getMesProblemes, declarerProbleme, getProjets } from "../api/api";
import { useTheme } from "../context/ThemeContext";

export default function ProblemeScreen() {
  const { C } = useTheme();
  const PRIORITE_COLORS = { BASSE: C.success, MOYENNE: C.warning, HAUTE: C.danger };
  const [problemes, setProblemes] = useState([]);
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formTitre, setFormTitre] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formProjet, setFormProjet] = useState(null);
  const [formPriorite, setFormPriorite] = useState("MOYENNE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, pr] = await Promise.all([getMesProblemes(), getProjets()]);
      setProblemes(p); setProjets(pr); setLoading(false);
    })();
  }, []);

  const handleDeclarer = async () => {
    if (!formTitre.trim()) { Alert.alert("Titre requis"); return; }
    setSaving(true);
    try {
      const newP = await declarerProbleme({ titre: formTitre.trim(), description: formDesc.trim(), projetId: formProjet?.id || null, priorite: formPriorite });
      setProblemes((prev) => [newP, ...prev]);
      setFormTitre(""); setFormDesc(""); setFormProjet(null); setFormPriorite("MOYENNE");
      setModalVisible(false);
    } catch (e) { Alert.alert("Erreur", e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.accent} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={problemes} keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <MaterialIcons name="warning" size={56} color={C.border} />
            <Text style={{ color: C.muted, fontSize: 15, marginTop: 12 }}>Aucun problème déclaré</Text>
          </View>
        }
        renderItem={({ item: p }) => {
          const color = PRIORITE_COLORS[p.priorite] || C.muted;
          return (
            <View style={[styles.problemCard, { backgroundColor: C.card, borderColor: C.border, borderLeftColor: color }]}>
              <View style={styles.problemHeader}>
                <Text style={[styles.problemTitre, { color: C.text }]}>{p.titre}</Text>
                <View style={[styles.prioriteBadge, { backgroundColor: color + "22" }]}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color }}>{p.priorite}</Text>
                </View>
              </View>
              {p.description ? <Text style={{ color: C.muted, fontSize: 13, marginBottom: 6 }} numberOfLines={2}>{p.description}</Text> : null}
              {p.projetNom ? <Text style={{ color: C.accent, fontSize: 12, marginBottom: 6 }}><MaterialIcons name="folder" size={12} color={C.accent} /> {p.projetNom}</Text> : null}
              <View style={[styles.statutChip, { backgroundColor: C.muted + "22" }]}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: C.muted }}>{p.statut || "OUVERT"}</Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: C.danger }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: C.modalBox }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>Déclarer un problème</Text>
            <Text style={[styles.inputLabel, { color: C.muted }]}>Titre *</Text>
            <TextInput style={[styles.input, { borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Titre du problème" placeholderTextColor={C.muted} value={formTitre} onChangeText={setFormTitre} />
            <Text style={[styles.inputLabel, { color: C.muted }]}>Description</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: "top", borderColor: C.border, color: C.text, backgroundColor: C.inputBg }]} placeholder="Décrivez le problème..." placeholderTextColor={C.muted} value={formDesc} onChangeText={setFormDesc} multiline />
            <Text style={[styles.inputLabel, { color: C.muted }]}>Projet concerné</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {projets.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.devChip, { borderColor: C.border, backgroundColor: C.bg }, formProjet?.id === p.id && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setFormProjet(p)}>
                  <Text style={[{ fontSize: 13 }, formProjet?.id === p.id ? { color: "#fff" } : { color: C.text }]}>{p.nom}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.inputLabel, { color: C.muted }]}>Priorité</Text>
            <View style={styles.prioriteRow}>
              {["BASSE", "MOYENNE", "HAUTE"].map((pr) => (
                <TouchableOpacity key={pr} style={[styles.prioriteChip, { borderColor: PRIORITE_COLORS[pr] }, formPriorite === pr && { backgroundColor: PRIORITE_COLORS[pr] }]} onPress={() => setFormPriorite(pr)}>
                  <Text style={{ fontWeight: "bold", fontSize: 13, color: formPriorite === pr ? "#fff" : PRIORITE_COLORS[pr] }}>{pr}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btnCancel, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: C.muted, fontWeight: "600" }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, { backgroundColor: C.danger }]} onPress={handleDeclarer} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveTxt}>Déclarer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyCard: { padding: 40, alignItems: "center", borderRadius: 12, borderWidth: 1 },
  problemCard: { borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderLeftWidth: 4 },
  problemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  problemTitre: { fontWeight: "bold", fontSize: 15, flex: 1 },
  prioriteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 8 },
  statutChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  fab: { position: "absolute", bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 6 },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "300" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  inputLabel: { fontSize: 13, marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 14 },
  devChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  prioriteRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  prioriteChip: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 2, alignItems: "center" },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  btnSaveTxt: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
