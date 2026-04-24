import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  primary: "#0D2B6E",
  accent: "#5BB8E8",
  bg: "#F5F8FD",
  text: "#1A2B4A",
  muted: "#8A9FBF",
  border: "#E0EAF5",
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!matricule.trim() || !password) {
      Alert.alert("Champs requis", "Matricule et mot de passe obligatoires.");
      return;
    }
    setLoading(true);
    try {
      await login(matricule.trim(), password);
    } catch (e) {
      Alert.alert("Connexion échouée", e.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoZone}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>BEA</Text>
          </View>
          <Text style={styles.appName}>BEA Tasks</Text>
          <Text style={styles.tagline}>Gestion des tâches et projets</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Matricule</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: EMP-2024-001"
            placeholderTextColor={COLORS.muted}
            value={matricule}
            onChangeText={setMatricule}
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="next"
          />

          <Text style={styles.inputLabel}>Mot de passe</Text>
          {/* ✅ Fix clavier : TextInput séparé sans wrapper compliqué */}
          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="Mot de passe"
              placeholderTextColor={COLORS.muted}
              value={password}
              onChangeText={setPassword}
              // ✅ Ces props corrigent le problème de clavier Android
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.eyeText}>{showPass ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoZone: { alignItems: "center", marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  appName: { color: COLORS.text, fontSize: 28, fontWeight: "bold" },
  tagline: { color: COLORS.muted, fontSize: 14, marginTop: 4 },

  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  // ✅ Fix : le champ password est un View avec TextInput dedans
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    paddingRight: 12,
  },
  passInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 20 },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  loginBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
