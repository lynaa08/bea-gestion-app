import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, Alert, TouchableOpacity
} from 'react-native';
import { getProjet } from '../api/api';

const STATUT_LABELS = {
  EN_COURS: 'En cours', NON_COMMENCE: 'Non commencé',
  CLOTURE: 'Clôturé', PAS_DE_VISIBILITE: 'Pas de visibilité',
};

export default function ProjetDetailScreen({ route }) {
  const { projet: projetInit } = route.params;
  const [projet, setProjet]   = useState(projetInit);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getProjet(projet.id);
      setProjet(data);
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }

  function InfoRow({ label, value }) {
    if (!value) return null;
    return (
      <View style={s.row}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    );
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#0D2B6E" /></View>
  );

  return (
    <ScrollView style={s.root}
      refreshControl={<RefreshControl refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); load(); }} />}>

      {/* Nom projet */}
      <View style={s.hero}>
        <Text style={s.heroNom}>{projet.nom}</Text>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeTxt}>
            {STATUT_LABELS[projet.statut] || projet.statut || '—'}
          </Text>
        </View>
      </View>

      {/* Informations */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Informations</Text>
        <InfoRow label="Type"           value={projet.type} />
        <InfoRow label="Priorité"       value={projet.priorite} />
        <InfoRow label="Chef de projet" value={projet.chefProjetNom} />
        <InfoRow label="Matricule chef" value={projet.chefProjetMatricule} />
        <InfoRow label="Date début"     value={projet.dateDebut} />
        <InfoRow label="Deadline"       value={projet.deadline} />
        <InfoRow label="Date création"  value={projet.dateCreation} />
      </View>

      {/* Description */}
      {projet.description && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <Text style={s.desc}>{projet.description}</Text>
        </View>
      )}

      {/* Placeholder tâches */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Tâches de l'équipe</Text>
        <View style={s.placeholder}>
          <Text style={s.placeholderTxt}>
            📋 Les tâches de chaque développeur apparaîtront ici{'\n'}
            (nécessite l'ajout de l'entité Tâche dans le backend)
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F5F8FD' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero:      { backgroundColor: '#0D2B6E', padding: 20, paddingTop: 20 },
  heroNom:   { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  heroBadge: { backgroundColor: 'rgba(91,184,232,0.2)', borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  heroBadgeTxt:{ color: '#5BB8E8', fontSize: 12, fontWeight: '600' },
  section:   { backgroundColor: '#fff', margin: 16, marginBottom: 0,
                borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#E8EEF8' },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: '#0D2B6E',
                  marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:       { flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#F0F4FA' },
  rowLabel:  { fontSize: 13, color: '#8A9FBF', flex: 1 },
  rowValue:  { fontSize: 13, color: '#1A2D5A', fontWeight: '500', flex: 1, textAlign: 'right' },
  desc:      { fontSize: 14, color: '#4A6080', lineHeight: 22 },
  placeholder:{ backgroundColor: '#F5F8FD', borderRadius: 8, padding: 20, alignItems: 'center' },
  placeholderTxt:{ fontSize: 12, color: '#B0BDD0', textAlign: 'center', lineHeight: 20 },
});
