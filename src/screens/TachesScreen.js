import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { getProjets } from '../api/api';
import { useAuth, ROLES, hasRole } from '../context/AuthContext';

export default function TachesScreen() {
  const { user } = useAuth();
  const [projets, setProjets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getProjets();
      // Pour le dev, filtrer les projets où il est chef ou membre
      setProjets(data);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les projets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  function renderProjet({ item }) {
    return (
      <View style={s.card}>
        <Text style={s.projetNom}>{item.nom}</Text>
        <Text style={s.projetMeta}>
          {item.chefProjetNom || 'Non assigné'}  ·  {item.type || '—'}
        </Text>
        <View style={s.placeholder}>
          <Text style={s.placeholderTxt}>
            📋 Les tâches seront affichées ici{'\n'}
            (nécessite l'API /taches dans le backend)
          </Text>
        </View>
      </View>
    );
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#0D2B6E" /></View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes tâches</Text>
        <Text style={s.headerSub}>{user?.prenom} {user?.nom} · {user?.matricule}</Text>
      </View>
      <FlatList
        data={projets}
        keyExtractor={i => String(i.id)}
        renderItem={renderProjet}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Text style={s.empty}>Aucun projet assigné</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F5F8FD' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: '#0D2B6E', padding: 16, paddingTop: 50 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerSub:   { fontSize: 12, color: '#5BB8E8', marginTop: 2 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
                  borderWidth: 0.5, borderColor: '#E8EEF8', elevation: 2 },
  projetNom:   { fontSize: 15, fontWeight: '700', color: '#0D2B6E', marginBottom: 4 },
  projetMeta:  { fontSize: 12, color: '#8A9FBF', marginBottom: 12 },
  placeholder: { backgroundColor: '#F5F8FD', borderRadius: 8, padding: 16, alignItems: 'center' },
  placeholderTxt:{ fontSize: 12, color: '#B0BDD0', textAlign: 'center', lineHeight: 20 },
  empty:       { textAlign: 'center', color: '#B0BDD0', marginTop: 40 },
});
