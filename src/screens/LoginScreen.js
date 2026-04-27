import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Alert, ScrollView, Dimensions, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

function EyeIcon({ off, color }) {
  if (off) return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M1 1l22 22" />
    </Svg>
  );
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

function AnimatedItem({ delay = 0, children }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { C, isDark } = useTheme();
  const [matricule, setMatricule] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleLogin = async () => {
    if (!matricule.trim() || !password) {
      Alert.alert("Champs requis", "Matricule et mot de passe sont obligatoires.");
      return;
    }
    setLoading(true);
    try { await login(matricule.trim(), password); }
    catch (e) { Alert.alert("Connexion échouée", e.message || "Identifiants incorrects"); }
    finally { setLoading(false); }
  };

  const h = 60;
  const wavePath = `M0 20 C${width*0.2} 40, ${width*0.4} 5, ${width*0.6} 25 C${width*0.8} 45, ${width*0.933} 10, ${width} 20 L${width} ${h} L0 ${h} Z`;

  // Couleurs adaptées au thème
  const formBg = isDark ? C.bg : "#F5F8FD";
  const inputBg = isDark ? C.card : "#FFFFFF";
  const inputBorder = isDark ? C.border : "#E0EAF5";
  const inputBorderFocus = isDark ? C.accent : "#0D2B6E";
  const labelColor = isDark ? C.muted : "#5A6A82";
  const placeholderColor = isDark ? "#4A5A7A" : "#9DB5D0";
  const footerColor = isDark ? "#4A5A7A" : "#aab8cc";
  const waveColor = isDark ? C.bg : "#F5F8FD";

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={{ flex: 1, backgroundColor: formBg }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── Gradient header (identique light/dark — couleur de marque) ── */}
        <LinearGradient colors={C.grad} style={s.header}>
          <AnimatedItem delay={150}>
            <View style={{ marginTop: 80 }}>
              <Text style={s.welcomeText}>Bienvenue !</Text>
              <Text style={s.signinTitle}>Connexion</Text>
            </View>
          </AnimatedItem>
          <View style={[s.waveWrap, { marginLeft: -28, marginTop: 80 }]}>
            <Svg width={width} height={h}>
              <Path d={wavePath} fill={waveColor} />
            </Svg>
          </View>
        </LinearGradient>

        {/* ── Formulaire ── */}
        <View style={[s.form, { backgroundColor: formBg }]}>

          <AnimatedItem delay={250}>
            <View style={{ marginBottom: 20 }}>
              <Text style={[s.label, { color: labelColor }]}>Matricule</Text>
              <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: focused === "mat" ? inputBorderFocus : inputBorder }]}>
                <TextInput
                  style={[s.input, { color: C.text }]}
                  placeholder="Ex : EMP-2024-001"
                  placeholderTextColor={placeholderColor}
                  value={matricule}
                  onChangeText={setMatricule}
                  onFocus={() => setFocused("mat")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>
          </AnimatedItem>

          <AnimatedItem delay={370}>
            <View style={{ marginBottom: 10 }}>
              <Text style={[s.label, { color: labelColor }]}>Mot de passe</Text>
              <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: focused === "pwd" ? inputBorderFocus : inputBorder }]}>
                <TextInput
                  style={[s.input, { flex: 1, color: C.text }]}
                  placeholder="Mot de passe"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  onFocus={() => setFocused("pwd")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                  <EyeIcon off={showPass} color={labelColor} />
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedItem>

          <AnimatedItem delay={490}>
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ marginTop: 78 }}>
              <LinearGradient colors={C.grad} style={s.loginBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.loginBtnText}>Se connecter</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </AnimatedItem>

          <AnimatedItem delay={690}>
            <Text style={[s.footer, { color: footerColor }]}>© 2026 BEA — Tous droits réservés</Text>
          </AnimatedItem>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 70, paddingHorizontal: 28, minHeight: 250 },
  welcomeText: { color: "rgba(255,255,255,0.65)", marginBottom: 7 },
  signinTitle: { color: "#fff", fontSize: 38, fontWeight: "800" },
  waveWrap: {},
  form: { flex: 1, paddingHorizontal: 24, paddingTop: 69, paddingBottom: 50 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14 },
  eyeBtn: { padding: 8 },
  loginBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  loginBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  footer: { textAlign: "center", marginTop: 30 },
});
