import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricule, setMatricule] = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [showPwd, setShowPwd]     = useState(false);

  async function handleLogin() {
    if (!matricule.trim() || !password.trim()) {
      Alert.alert('Champs requis', 'Veuillez saisir votre matricule et mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await login(matricule.trim(), password);
    } catch (e) {
      Alert.alert('Connexion échouée', e.message || 'Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header bleu */}
      <View style={s.header}>
        <Text style={s.logo}>BEA</Text>
        <Text style={s.subtitle}>Banque Extérieure d'Algérie</Text>
        <Text style={s.tagline}>Portail de gestion interne</Text>
      </View>

      {/* Formulaire */}
      <View style={s.card}>
        <Text style={s.title}>Connexion</Text>

        <Text style={s.label}>Matricule</Text>
        <TextInput
          style={s.input}
          placeholder="Ex: ADM001"
          placeholderTextColor="#B0BDD0"
          value={matricule}
          onChangeText={setMatricule}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={s.label}>Mot de passe</Text>
        <View style={s.pwdRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="••••••••"
            placeholderTextColor="#B0BDD0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPwd}
          />
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={s.eyeBtn}>
            <Text style={s.eyeTxt}>{showPwd ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>SE CONNECTER</Text>}
        </TouchableOpacity>

        <View style={s.demoBox}>
          <Text style={s.demoTitle}>Comptes de démonstration</Text>
          <Text style={s.demoTxt}>ADM001 / admin123  —  PMO001 / pmo123</Text>
          <Text style={s.demoTxt}>DEV001 / dev123  —  DIR001 / dir123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#0D2B6E' },
  header:   { alignItems: 'center', paddingTop: 70, paddingBottom: 40 },
  logo:     { fontSize: 48, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  subtitle: { fontSize: 14, color: '#5BB8E8', marginTop: 6 },
  tagline:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  card:     { flex: 1, backgroundColor: '#F5F8FD', borderTopLeftRadius: 28,
               borderTopRightRadius: 28, padding: 28 },
  title:    { fontSize: 22, fontWeight: 'bold', color: '#0D2B6E', marginBottom: 24 },
  label:    { fontSize: 11, fontWeight: '600', color: '#4A6080',
               textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:    { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D8E6F2',
               borderRadius: 10, padding: 13, fontSize: 15, color: '#1A2D5A', marginBottom: 16 },
  pwdRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn:   { padding: 10, marginLeft: 8 },
  eyeTxt:   { fontSize: 18 },
  btn:      { backgroundColor: '#0D2B6E', borderRadius: 12, padding: 15,
               alignItems: 'center', marginTop: 8 },
  btnTxt:   { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  demoBox:  { marginTop: 28, backgroundColor: '#E8F4FF', borderRadius: 10, padding: 14 },
  demoTitle:{ fontSize: 12, fontWeight: 'bold', color: '#0D2B6E', marginBottom: 6 },
  demoTxt:  { fontSize: 11, color: '#4A6080', marginBottom: 2 },
});
