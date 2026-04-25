import React, { useEffect, useState } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { getMesProblemes, declarerProbleme, getProjets } from "../api/api";

const COLORS = {
  primary: "#0D2B6E",
  accent: "#5BB8E8",
  bg: "#F5F8FD",
  card: "#fff",
  border: "#E0EAF5",
  text: "#1A2B4A",
  muted: "#8A9FBF",
  warning: "#F39C12",
  danger: "#E74C3C",
  success: "#27AE60",
};

const PRIORITE_COLORS = {
  BASSE: COLORS.success,
  MOYENNE: COLORS.warning,
  HAUTE: COLORS.danger,
};

export default function ProblemeScreen() {
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
      setProblemes(p);
      setProjets(pr);
      setLoading(false);
    })();
  }, []);

  const handleDeclarer = async () => {
    if (!formTitre.trim()) {
      Alert.alert("Titre requis");
      return;
    }
    setSaving(true);
    try {
      const newP = await declarerProbleme({
        titre: formTitre.trim(),
        description: formDesc.trim(),
        projetId: formProjet?.id || null,
        priorite: formPriorite,
      });
      setProblemes((prev) => [newP, ...prev]);
      setFormTitre("");
      setFormDesc("");
      setFormProjet(null);
      setFormPriorite("MOYENNE");
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
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
      <FlatList
        data={problemes}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <MaterialIcons name="warning" size={56} color="#C0D0E8" />
            <Text style={styles.emptyText}>Aucun problème déclaré</Text>
          </View>
        }
        renderItem={({ item: p }) => {
          const color = PRIORITE_COLORS[p.priorite] || COLORS.muted;
          return (
            <View style={[styles.problemCard, { borderLeftColor: color }]}>
              <View style={styles.problemHeader}>
                <Text style={styles.problemTitre}>{p.titre}</Text>
                <View
                  style={[
                    styles.prioriteBadge,
                    { backgroundColor: color + "22" },
                  ]}>
                  <Text style={[styles.prioriteText, { color }]}>
                    {p.priorite}
                  </Text>
                </View>
              </View>
              {p.description && (
                <Text style={styles.problemDesc} numberOfLines={2}>
                  {p.description}
                </Text>
              )}
              {p.projetNom && (
                <Text style={styles.problemProjet}>
                  <MaterialIcons name="folder" size={12} color="#5BB8E8" />{" "}
                  {p.projetNom}
                </Text>
              )}
              <View
                style={[
                  styles.statutChip,
                  { backgroundColor: COLORS.muted + "22" },
                ]}>
                <Text style={[styles.statutChipText, { color: COLORS.muted }]}>
                  {p.statut || "OUVERT"}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal déclarer problème */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Déclarer un problème</Text>

            <Text style={styles.inputLabel}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre du problème"
              value={formTitre}
              onChangeText={setFormTitre}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Décrivez le problème..."
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Projet concerné</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 4 }}>
              {projets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.devChip,
                    formProjet?.id === p.id && styles.devChipSel,
                  ]}
                  onPress={() => setFormProjet(p)}>
                  <Text
                    style={[
                      styles.devChipTxt,
                      formProjet?.id === p.id && { color: "#fff" },
                    ]}>
                    {p.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Priorité</Text>
            <View style={styles.prioriteRow}>
              {["BASSE", "MOYENNE", "HAUTE"].map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[
                    styles.prioriteChip,
                    { borderColor: PRIORITE_COLORS[pr] },
                    formPriorite === pr && {
                      backgroundColor: PRIORITE_COLORS[pr],
                    },
                  ]}
                  onPress={() => setFormPriorite(pr)}>
                  <Text
                    style={[
                      styles.prioriteChipTxt,
                      {
                        color:
                          formPriorite === pr ? "#fff" : PRIORITE_COLORS[pr],
                      },
                    ]}>
                    {pr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleDeclarer}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveTxt}>Déclarer</Text>
                )}
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
  emptyCard: {
    padding: 40,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15 },
  problemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  problemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  problemTitre: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 15,
    flex: 1,
  },
  prioriteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  prioriteText: { fontSize: 11, fontWeight: "700" },
  problemDesc: { color: COLORS.muted, fontSize: 13, marginBottom: 6 },
  problemProjet: { color: COLORS.accent, fontSize: 12, marginBottom: 6 },
  statutChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statutChipText: { fontSize: 11, fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 32, lineHeight: 36, fontWeight: "300" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
    textAlign: "center",
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  devChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.bg,
  },
  devChipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  devChipTxt: { color: COLORS.text, fontSize: 13 },
  prioriteRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  prioriteChip: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  prioriteChipTxt: { fontWeight: "bold", fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnCancelTxt: { color: COLORS.muted, fontWeight: "600" },
  btnSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
  },
  btnSaveTxt: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
