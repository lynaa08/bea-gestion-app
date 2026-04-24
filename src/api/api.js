import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️  Remplacez par l'IP de votre PC (ipconfig → IPv4)
// Exemple : http://localhost:8082/api
// ✅ Remove "/users" from the base
export const BASE_URL = "http:// 192.168.1.13:8081/api";

export async function getToken() {
  return await AsyncStorage.getItem("token");
}

export async function getAuthHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  return res;
}

// Auth
export async function login(matricule, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matricule, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Identifiants incorrects");
  return data;
}

// Projets
export async function getProjets() {
  const res = await apiFetch("/projets/all");
  if (!res.ok) throw new Error("Erreur chargement projets");
  return res.json();
}

export async function getProjet(id) {
  const res = await apiFetch(`/projets/${id}`);
  if (!res.ok) throw new Error("Projet non trouvé");
  return res.json();
}

export async function createProjet(data) {
  const res = await apiFetch("/projets", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur création projet");
  return res.json();
}

// Notifications
export async function getNotifications() {
  const res = await apiFetch("/notifications/me");
  if (!res.ok) return [];
  return res.json();
}

export async function getNotifCount() {
  const res = await apiFetch("/notifications/me/count");
  if (!res.ok) return { count: 0 };
  return res.json();
}

export async function markNotifRead(id) {
  await apiFetch(`/notifications/${id}/lue`, { method: "PATCH" });
}

export async function markAllNotifsRead() {
  await apiFetch("/notifications/me/toutes-lues", { method: "PATCH" });
}

// Problèmes
export async function getMesProblemes() {
  const res = await apiFetch("/problemes/mine");
  if (!res.ok) return [];
  return res.json();
}

export async function getProblemes() {
  const res = await apiFetch("/problemes");
  if (!res.ok) return [];
  return res.json();
}

export async function declarerProbleme(data) {
  const res = await apiFetch("/problemes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur déclaration problème");
  return res.json();
}

// Utilisateurs
export async function getUsers() {
  const res = await apiFetch("/users");
  if (!res.ok) return [];
  return res.json();
}
