import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import { getMesProblemes, declarerProbleme, getProjets } from '../api/api';

const PRIORITES = ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'];
const STATUT_COLORS = {
  OUVERT:   { bg: '#FFF3CD', txt: '#856404' },
  EN_COURS: { bg: '#CCE5FF', txt: '#004085' },
  RESOLU:   { bg: '#D4EDDA', txt: '#155724' },
  FERME:    { bg: '#F0F0F0', txt: '#666' },
};

export default function ProblemeScreen() {
  const [problemes, setProblemes] = useState([]);
  const [projets, setProjets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm]           = useState({
    titre: '', description: '', priorite: 'MOYENNE', projetId: null
  });
  const [saving, setSaving]       = useState(false);

  async function load() {
    try {
      const [p, pr] = await Promise.all([getMesProblemes(), getProjets()]);
      setProblemes(p);
      setProjets(pr);
    } catch (e) {}
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleDeclarer() {
    if (!form.titre.trim()) {
      Alert.alert('Champ requis', 'Le titre est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      await declarerProbleme(form);
      Alert.alert('✅ Envoyé', 'Problème déclaré au PMO avec succès.');
      setForm({ titre: '', description: '', priorite: 'MOYENNE', projetId: null });
      setShowForm(false);
      load();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  }

  function renderProbleme({ item }) {
    const sc = STATUT_COLORS[item.statut] || STATUT_COLORS.OUVERT;
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <Text style={s.cardTitre} numberOfLines={1}>{item.titre}</Text>
          <View style={[s.badge, { backgroundColor: sc.bg }]}>
            <Text style={[s.badgeTxt, { color: sc.txt }]}>{item.statut}</Text>
          </View>
        </View>
        {item.description ? <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.cardMeta}>
          <Text style={s.metaTxt}>⚡ {item.priorite}</Text>
          {item.projet && <Text style={s.metaTxt}>📁 {item.projet.nom}</Text>}
        </View>
        {item.commentairePmo && (
          <View style={s.pmoComment}>
            <Text style={s.pmoTxt}>💬 PMO : {item.commentairePmo}</Text>
          </View>
        )}
      </View>
    );
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#0D2B6E" /></View>
  );

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mes problèmes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={s.addBtnTxt}>{showForm ? '✕ Annuler' : '+ Déclarer'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={s.form}>
          <Text style={s.formTitle}>Déclarer un problème au PMO</Text>

          <Text style={s.label}>Titre *</Text>
          <TextInput style={s.input} placeholder="Titre du problème"
            placeholderTextColor="#B0BDD0" value={form.titre}
            onChangeText={v => setForm(f => ({ ...f, titre: v }))} />

          <Text style={s.label}>Priorité</Text>
          <View style={s.prioriteRow}>
            {PRIORITES.map(p => (
              <TouchableOpacity key={p}
                style={[s.prioriteBtn, form.priorite === p && s.prioriteBtnActive]}
                onPress={() => setForm(f => ({ ...f, priorite: p }))}>
                <Text style={[s.prioriteBtnTxt, form.priorite === p && s.prioriteBtnTxtActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Détaillez le problème..." placeholderTextColor="#B0BDD0"
            multiline value={form.description}
            onChangeText={v => setForm(f => ({ ...f, description: v }))} />

          <Text style={s.label}>Projet concerné</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <TouchableOpacity style={[s.projetChip, !form.projetId && s.projetChipActive]}
              onPress={() => setForm(f => ({ ...f, projetId: null }))}>
              <Text style={!form.projetId ? s.chipTxtActive : s.chipTxt}>Aucun</Text>
            </TouchableOpacity>
            {projets.map(p => (
              <TouchableOpacity key={p.id}
                style={[s.projetChip, form.projetId === p.id && s.projetChipActive]}
                onPress={() => setForm(f => ({ ...f, projetId: p.id }))}>
                <Text style={form.projetId === p.id ? s.chipTxtActive : s.chipTxt} numberOfLines={1}>
                  {p.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={s.sendBtn} onPress={handleDeclarer} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.sendBtnTxt}>📤 Envoyer au PMO</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      <FlatList
        data={problemes}
        keyExtractor={i => String(i.id)}
        renderItem={renderProbleme}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <Text style={s.empty}>🎉 Aucun problème déclaré</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F5F8FD' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: '#0D2B6E', flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', padding: 16, paddingTop: 50 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addBtn:      { backgroundColor: '#E05A2B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  addBtnTxt:   { color: '#fff', fontWeight: '600', fontSize: 13 },
  form:        { backgroundColor: '#fff', padding: 16, maxHeight: 420,
                  borderBottomWidth: 0.5, borderBottomColor: '#E8EEF8' },
  formTitle:   { fontSize: 14, fontWeight: '700', color: '#0D2B6E', marginBottom: 14 },
  label:       { fontSize: 11, fontWeight: '600', color: '#4A6080', textTransform: 'uppercase',
                  letterSpacing: 0.8, marginBottom: 6 },
  input:       { backgroundColor: '#F5F8FD', borderWidth: 1.5, borderColor: '#D8E6F2',
                  borderRadius: 8, padding: 11, fontSize: 14, color: '#1A2D5A', marginBottom: 14 },
  prioriteRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  prioriteBtn: { borderWidth: 1.5, borderColor: '#D8E6F2', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 6 },
  prioriteBtnActive:{ backgroundColor: '#0D2B6E', borderColor: '#0D2B6E' },
  prioriteBtnTxt:   { fontSize: 12, color: '#4A6080' },
  prioriteBtnTxtActive:{ color: '#fff', fontWeight: '600' },
  projetChip:  { borderWidth: 1.5, borderColor: '#D8E6F2', borderRadius: 20,
                  paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, maxWidth: 160 },
  projetChipActive:{ backgroundColor: '#0D2B6E', borderColor: '#0D2B6E' },
  chipTxt:     { fontSize: 12, color: '#4A6080' },
  chipTxtActive:{ color: '#fff', fontWeight: '600' },
  sendBtn:     { backgroundColor: '#0D2B6E', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 20 },
  sendBtnTxt:  { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
                  borderWidth: 0.5, borderColor: '#E8EEF8', elevation: 2 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitre:   { fontSize: 14, fontWeight: '700', color: '#0D2B6E', flex: 1, marginRight: 8 },
  badge:       { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:    { fontSize: 10, fontWeight: '700' },
  cardDesc:    { fontSize: 12, color: '#6A80A0', marginBottom: 8 },
  cardMeta:    { flexDirection: 'row', gap: 12 },
  metaTxt:     { fontSize: 11, color: '#8A9FBF' },
  pmoComment:  { marginTop: 8, backgroundColor: '#EEF4FF', borderRadius: 6, padding: 8 },
  pmoTxt:      { fontSize: 12, color: '#4A6080' },
  empty:       { textAlign: 'center', color: '#B0BDD0', marginTop: 40, fontSize: 14 },
});
