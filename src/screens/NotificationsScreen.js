import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { getNotifications, markNotifRead, markAllNotifsRead } from '../api/api';

const TYPE_INFO = {
  PROJET_CREE:      { icon: '🆕', color: '#EEF4FF' },
  PROJET_MODIFIE:   { icon: '✏️', color: '#FFF4E0' },
  PROBLEME_SIGNALE: { icon: '⚠️', color: '#FFF0F0' },
  USER_CREE:        { icon: '👤', color: '#F0F8FF' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString('fr-FR');
}

export default function NotificationsScreen() {
  const [notifs, setNotifs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifs(data);
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  async function handleRead(id) {
    await markNotifRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
  }

  async function handleReadAll() {
    await markAllNotifsRead();
    setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
  }

  function renderItem({ item }) {
    const info = TYPE_INFO[item.type] || { icon: '🔔', color: '#F4F7FC' };
    return (
      <TouchableOpacity
        style={[s.item, !item.lue && s.itemUnread]}
        onPress={() => handleRead(item.id)}>
        <View style={[s.iconBox, { backgroundColor: info.color }]}>
          <Text style={{ fontSize: 20 }}>{info.icon}</Text>
        </View>
        <View style={s.itemBody}>
          <Text style={s.itemTitle}>{item.titre}</Text>
          <Text style={s.itemMsg} numberOfLines={2}>{item.message}</Text>
          <Text style={s.itemTime}>
            {timeAgo(item.dateCreation)}{item.projetNom ? ` · ${item.projetNom}` : ''}
          </Text>
        </View>
        {!item.lue && <View style={s.dot} />}
      </TouchableOpacity>
    );
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#0D2B6E" /></View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleReadAll}>
          <Text style={s.markAll}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifs}
        keyExtractor={i => String(i.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Text style={s.empty}>🔔{'\n'}Aucune notification</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5F8FD' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 backgroundColor: '#0D2B6E', padding: 16, paddingTop: 50 },
  headerTitle:{ fontSize: 18, fontWeight: 'bold', color: '#fff' },
  markAll:    { fontSize: 12, color: '#5BB8E8' },
  item:       { flexDirection: 'row', backgroundColor: '#fff', padding: 14,
                 borderBottomWidth: 0.5, borderBottomColor: '#F0F4FA', alignItems: 'flex-start' },
  itemUnread: { backgroundColor: '#EEF6FF' },
  iconBox:    { width: 44, height: 44, borderRadius: 10, justifyContent: 'center',
                 alignItems: 'center', marginRight: 12, flexShrink: 0 },
  itemBody:   { flex: 1 },
  itemTitle:  { fontSize: 13, fontWeight: '700', color: '#0D2B6E', marginBottom: 2 },
  itemMsg:    { fontSize: 12, color: '#6A80A0', marginBottom: 4 },
  itemTime:   { fontSize: 10, color: '#B0BDD0' },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5BB8E8',
                 marginLeft: 8, marginTop: 4 },
  empty:      { textAlign: 'center', color: '#B0BDD0', marginTop: 60, fontSize: 16, lineHeight: 30 },
});
