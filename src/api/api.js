import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Remplacez par l'IP de votre PC (ipconfig → IPv4)
export const BASE_URL = "http://192.168.1.72:8081/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
export async function getToken() {
  return await AsyncStorage.getItem("token");
}

async function getAuthHeaders() {
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

// ─── Auth ─────────────────────────────────────────────────────────────────────
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

// ─── Projets ──────────────────────────────────────────────────────────────────
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

// ─── Tâches ───────────────────────────────────────────────────────────────────
// Récupérer toutes les tâches du user connecté
export async function getMesTaches() {
  const res = await apiFetch("/taches/me");
  if (!res.ok) return [];
  return res.json();
}

// Récupérer les tâches d'un projet
export async function getTachesProjet(projetId) {
  const res = await apiFetch(`/taches/projet/${projetId}`);
  if (!res.ok) return [];
  return res.json();
}

// Créer une tâche (depuis l'app)
export async function createTache(data) {
  // data = { titre, description, projetId, assigneMatricule, dateEcheance }
  const res = await apiFetch("/taches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur création tâche");
  return res.json();
}

// Mettre à jour le statut d'une tâche
export async function updateTacheStatut(id, statut) {
  const res = await apiFetch(`/taches/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) throw new Error("Erreur mise à jour tâche");
  return res.json();
}

// Marquer tâche terminée
export async function marquerTacheTerminee(id) {
  return updateTacheStatut(id, "TERMINEE");
}

// ─── Notifications ────────────────────────────────────────────────────────────
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

// ─── Problèmes ────────────────────────────────────────────────────────────────
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

// ─── Utilisateurs ─────────────────────────────────────────────────────────────
export async function getUsers() {
  const res = await apiFetch("/users");
  if (!res.ok) return [];
  return res.json();
}

export async function getDevelopeurs() {
  const res = await apiFetch("/users/role/DEVELOPPEUR");
  if (!res.ok) return [];
  return res.json();
}
