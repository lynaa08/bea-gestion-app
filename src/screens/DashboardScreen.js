import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getProjets, getNotifCount } from '../api/api';

const STATUT_COLORS = {
  EN_COURS:         { bg: '#EEF6FF', txt: '#185FA5' },
  NON_COMMENCE:     { bg: '#FFF8E1', txt: '#BA7517' },
  CLOTURE:          { bg: '#E6F7EE', txt: '#0F6E56' },
  PAS_DE_VISIBILITE:{ bg: '#F1EFE8', txt: '#5F5E5A' },
};
const STATUT_LABELS = {
  EN_COURS:         'En cours',
  NON_COMMENCE:     'Non commencé',
  CLOTURE:          'Clôturé',
  PAS_DE_VISIBILITE:'Pas de visibilité',
};

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [projets, setProjets]       = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, n] = await Promise.all([getProjets(), getNotifCount()]);
      setProjets(p);
      setNotifCount(n.count || 0);
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') {
        Alert.alert('Session expirée', 'Reconnectez-vous.', [{ text: 'OK', onPress: logout }]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const roleDisplay = {
    ADMIN: 'Administrateur', DIRECTEUR: 'Directeur',
    CHEF_DEPARTEMENT: 'Chef Département',
    INGENIEUR_ETUDE_PMO: 'PMO', DEVELOPPEUR: 'Développeur',
  };

  function renderProjet({ item }) {
    const sc = STATUT_COLORS[item.statut] || STATUT_COLORS.NON_COMMENCE;
    return (
      <TouchableOpacity style={s.card}
        onPress={() => navigation.navigate('ProjetDetail', { projet: item })}>
        <View style={s.cardTop}>
          <Text style={s.cardNom} numberOfLines={1}>{item.nom}</Text>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeTxt, { color: sc.txt }]}>
              {STATUT_LABELS[item.statut] || item.statut}
            </Text>
          </View>
        </View>
        <View style={s.cardMeta}>
          <Text style={s.metaTxt}>
            {item.type || '—'}  ·  {item.chefProjetNom || 'Non assigné'}
          </Text>
          {item.deadline && <Text style={s.metaTxt}>📅 {item.deadline}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#0D2B6E" /></View>
  );

  return (
    <View style={s.root}>
      {/* User info */}
      <View style={s.userBanner}>
        <View>
          <Text style={s.userName}>{user?.prenom} {user?.nom}</Text>
          <Text style={s.userRole}>{roleDisplay[user?.role] || user?.role}</Text>
          <Text style={s.userMat}>{user?.matricule}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {notifCount > 0 && (
            <View style={s.notifBadge}>
              <Text style={s.notifBadgeTxt}>{notifCount > 99 ? '99+' : notifCount}</Text>
            </View>
          )}
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutTxt}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.sectionTitle}>Projets ({projets.length})</Text>

      <FlatList
        data={projets}
        keyExtractor={i => String(i.id)}
        renderItem={renderProjet}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Text style={s.empty}>Aucun projet trouvé</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5F8FD' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  userBanner: { backgroundColor: '#0D2B6E', padding: 20, paddingTop: 50,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName:   { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  userRole:   { fontSize: 12, color: '#5BB8E8', marginTop: 2 },
  userMat:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  notifBadge: { backgroundColor: '#E05A2B', borderRadius: 12, paddingHorizontal: 8,
                paddingVertical: 3, marginBottom: 6 },
  notifBadgeTxt:{ color: '#fff', fontSize: 11, fontWeight: 'bold' },
  logoutBtn:  { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 6 },
  logoutTxt:  { color: '#fff', fontSize: 12 },
  sectionTitle:{ fontSize: 14, fontWeight: '600', color: '#4A6080',
                  padding: 16, paddingBottom: 10 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
                borderWidth: 0.5, borderColor: '#E8EEF8',
                shadowColor: '#0D2B6E', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 8 },
  cardNom:    { fontSize: 15, fontWeight: '700', color: '#0D2B6E', flex: 1, marginRight: 8 },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:   { fontSize: 10, fontWeight: '700' },
  cardMeta:   { flexDirection: 'row', justifyContent: 'space-between' },
  metaTxt:    { fontSize: 12, color: '#8A9FBF' },
  empty:      { textAlign: 'center', color: '#B0BDD0', marginTop: 40, fontSize: 14 },
});
