import React, { useEffect, useState, useCallback } from "react";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth, canCreateTache } from "../context/AuthContext";
import {
  getProjet,
  getTachesProjet,
  createTache,
  getDevelopeurs,
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

const STATUT_TACHE = {
  A_FAIRE: { label: "À faire", color: COLORS.muted },
  EN_COURS: { label: "En cours", color: COLORS.warning },
  TERMINEE: { label: "Terminée", color: COLORS.success },
  BLOQUEE: { label: "Bloquée", color: COLORS.danger },
};

// ✅ Convertit JJ/MM/AAAA ou JJ-MM-AAAA → AAAA-MM-JJ (ISO requis par Spring Boot)
function toISO(str) {
  if (!str || !str.trim()) return null;
  const clean = str.trim().replace(/\//g, "-"); // accepte / ou -
  const parts = clean.split("-");
  if (parts.length !== 3) return null;
  const [a, b, c] = parts;
  // Si déjà en AAAA-MM-JJ
  if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
  // Sinon JJ-MM-AAAA → AAAA-MM-JJ
  return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
}

export default function ProjetDetailScreen({ route, navigation }) {
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
      const [p, t] = await Promise.all([
        getProjet(projetId),
        getTachesProjet(projetId),
      ]);
      setProjet(p);
      setTaches(t);
      if (canCreateTache(user)) {
        const d = await getDevelopeurs();
        setDevs(d);
      }
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  }, [projetId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTache = async () => {
    if (!formTitre.trim()) {
      Alert.alert("Titre requis", "Veuillez saisir le titre de la tâche.");
      return;
    }

    // ✅ Convertir la date avant d'envoyer au backend
    const dateISO = toISO(formDate);
    if (formDate.trim() && !dateISO) {
      Alert.alert(
        "Date invalide",
        "Format attendu : JJ/MM/AAAA\nExemple : 30/06/2026",
      );
      return;
    }

    setSaving(true);
    try {
      await createTache({
        titre: formTitre.trim(),
        description: formDesc.trim(),
        projetId,
        assigneMatricule: formDev?.matricule || null,
        dateEcheance: dateISO, // ✅ toujours en AAAA-MM-JJ
      });
      setFormTitre("");
      setFormDesc("");
      setFormDev(null);
      setFormDate("");
      setModalVisible(false);
      Alert.alert("✅ Tâche créée", `"${formTitre}" a été ajoutée au projet.`);
      await loadData();
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatut = async (tache) => {
    const newStatut = tache.statut === "TERMINEE" ? "A_FAIRE" : "TERMINEE";
    try {
      await updateTacheStatut(tache.id, newStatut);
      setTaches((prev) =>
        prev.map((t) => (t.id === tache.id ? { ...t, statut: newStatut } : t)),
      );
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!projet) return null;
  const peutCreer = canCreateTache(user);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* ── Nom Projet ── */}
        <View style={styles.nomBox}>
          <Text style={styles.nomProjet}>{projet.nom}</Text>
          <View
            style={[
              styles.statutBadge,
              { backgroundColor: COLORS.accent + "33" },
            ]}>
            <Text style={[styles.statutText, { color: COLORS.accent }]}>
              {projet.statut || "N/A"}
            </Text>
          </View>
        </View>

        {/* ── Infos projet ── */}
        <View style={styles.card}>
          <Row label="Matricule" value={projet.matricule} />
          <Row label="État" value={projet.etat} />
          <Row label="Type" value={projet.type} />
          {projet.description ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.desc}>{projet.description}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Équipe ── */}
        {projet.equipe?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>👥 Équipe</Text>
            {projet.equipe.map((m, i) => (
              <View key={m.matricule || i} style={styles.membreRow}>
                <View style={styles.membreAvatar}>
                  <Text style={styles.membreAvatarText}>
                    {(m.prenom?.[0] || "") + (m.nom?.[0] || "")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.membreNom}>
                    {m.prenom} {m.nom}
                  </Text>
                  <Text style={styles.membreMat}>{m.matricule}</Text>
                </View>
                <View style={styles.roleChip}>
                  <Text style={styles.roleText}>{m.role || "DEV"}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Tâches ── */}
        <View style={styles.tachesHeader}>
          <Text style={styles.sectionTitle}>📋 Tâches ({taches.length})</Text>
        </View>

        {taches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune tâche pour ce projet</Text>
          </View>
        ) : (
          <View style={styles.tachesGrid}>
            {taches.map((t) => {
              const st = STATUT_TACHE[t.statut] || STATUT_TACHE.A_FAIRE;
              const isDone = t.statut === "TERMINEE";
              return (
                // ✅ Tap → TacheDetail
                <TouchableOpacity
                  key={t.id}
                  style={[styles.tacheCard, isDone && styles.tacheCardDone]}
                  onPress={() =>
                    navigation.navigate("TacheDetail", { tacheId: t.id })
                  }
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.tacheStatutDot,
                      { backgroundColor: st.color },
                    ]}
                  />
                  <Text
                    style={[styles.tacheTitre, isDone && styles.tacheDoneText]}>
                    {t.titre}
                  </Text>
                  <Text style={styles.tacheDev}>
                    {t.assignePrenom || ""} {t.assigneNom || "—"}
                  </Text>
                  <View
                    style={[
                      styles.tacheBadge,
                      { backgroundColor: st.color + "22" },
                    ]}>
                    <Text style={[styles.tacheBadgeText, { color: st.color }]}>
                      {st.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── FAB + ── */}
      {peutCreer && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── Modal création tâche ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Handle */}
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nouvelle tâche</Text>

            <Text style={styles.inputLabel}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de la tâche"
              placeholderTextColor={COLORS.muted}
              value={formTitre}
              onChangeText={setFormTitre}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              placeholder="Description (optionnel)"
              placeholderTextColor={COLORS.muted}
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
            />

            <Text style={styles.inputLabel}>Assigner à (Développeur)</Text>
            <ScrollView
              style={styles.devList}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {devs.map((d) => (
                <TouchableOpacity
                  key={d.matricule}
                  style={[
                    styles.devChip,
                    formDev?.matricule === d.matricule &&
                      styles.devChipSelected,
                  ]}
                  onPress={() =>
                    setFormDev(formDev?.matricule === d.matricule ? null : d)
                  }>
                  <Text
                    style={[
                      styles.devChipText,
                      formDev?.matricule === d.matricule && { color: "#fff" },
                    ]}>
                    {d.prenom} {d.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ✅ Date avec format JJ/MM/AAAA clairement indiqué */}
            <Text style={styles.inputLabel}>Date d'échéance</Text>
            <TextInput
              style={styles.input}
              placeholder="JJ/MM/AAAA  ex: 30/06/2026"
              placeholderTextColor={COLORS.muted}
              value={formDate}
              onChangeText={setFormDate}
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setModalVisible(false);
                  setFormTitre("");
                  setFormDesc("");
                  setFormDev(null);
                  setFormDate("");
                }}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleCreateTache}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnSaveText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  nomBox: {
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nomProjet: { color: "#fff", fontSize: 20, fontWeight: "bold", flex: 1 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statutText: { fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.card,
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  label: { color: COLORS.muted, fontSize: 13 },
  value: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  desc: { color: COLORS.text, fontSize: 14, lineHeight: 20, marginTop: 4 },
  sectionTitle: { color: COLORS.text, fontWeight: "bold", fontSize: 15 },
  membreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  membreAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent + "44",
    justifyContent: "center",
    alignItems: "center",
  },
  membreAvatarText: { color: COLORS.primary, fontWeight: "bold", fontSize: 13 },
  membreNom: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  membreMat: { color: COLORS.muted, fontSize: 12 },
  roleChip: {
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: { color: COLORS.primary, fontSize: 11, fontWeight: "600" },
  tachesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  tachesGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  tacheCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    margin: "1.5%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tacheCardDone: { opacity: 0.6 },
  tacheStatutDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  tacheTitre: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
  },
  tacheDoneText: { textDecorationLine: "line-through", color: COLORS.muted },
  tacheDev: { color: COLORS.muted, fontSize: 12, marginBottom: 6 },
  tacheBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tacheBadgeText: { fontSize: 11, fontWeight: "600" },
  emptyCard: {
    margin: 12,
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.muted, fontSize: 14 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: "#fff", fontSize: 34, lineHeight: 38, fontWeight: "300" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
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
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  devList: { marginVertical: 4, maxHeight: 48 },
  devChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.bg,
  },
  devChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  devChipText: { color: COLORS.text, fontSize: 13 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  btnCancelText: { color: COLORS.muted, fontWeight: "600" },
  btnSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  btnSaveText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
