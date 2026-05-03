// src/api/api.js
// ✅ Toutes les requêtes passent par trackedFetch → mesure exacte des octets
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackedFetch } from "../services/NetworkTracker";

export const BASE_URL = "http://192.168.1.72:8081/api";

async function getToken() {
  return await AsyncStorage.getItem("token");
}

async function getAuthHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ✅ Remplace apiFetch — utilise trackedFetch pour mesurer les octets
async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await trackedFetch(`${BASE_URL}${path}`, { ...options }, headers);
  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  return res;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export async function login(matricule, password) {
  const headers = { "Content-Type": "application/json" };
  const res = await trackedFetch(
    `${BASE_URL}/auth/login`,
    { method: "POST", body: JSON.stringify({ matricule, password }) },
    headers,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Identifiants incorrects");
  return data;
}

// ─── Projets ───────────────────────────────────────────────────────────────
export async function getProjets() {
  const res = await apiFetch("/projets/all");
  if (!res.ok) throw new Error("Erreur chargement projets");
  return res.json();
}
export async function getMesProjets() {
  const res = await apiFetch("/projets/mes-projets");
  if (!res.ok) return [];
  return res.json();
}

export async function getMesProjets() {
  const res = await apiFetch("/projets/mes-projets");
  if (!res.ok) return [];
  return res.json();
}

export async function getProjet(id) {
  const res = await apiFetch(`/projets/${id}`);
  if (!res.ok) throw new Error("Projet non trouvé");
  return res.json();
}

// ─── Tâches ────────────────────────────────────────────────────────────────
export async function getMesTaches() {
  const res = await apiFetch("/taches/me");
  if (!res.ok) return [];
  return res.json();
}

export async function getTachesProjet(projetId) {
  const res = await apiFetch(`/taches/projet/${projetId}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getTache(id) {
  const res = await apiFetch(`/taches/${id}`);
  if (!res.ok) throw new Error("Tâche introuvable");
  return res.json();
}

export async function createTache(data) {
  const res = await apiFetch("/taches", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    let msg = "Erreur création tâche";
    try {
      const err = await res.json();
      msg = err.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function updateTacheStatut(id, statut) {
  const res = await apiFetch(`/taches/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) throw new Error("Erreur mise à jour tâche");
  return res.json();
}

// ─── Sous-tâches ──────────────────────────────────────────────────────────
export async function getSousTaches(tacheId) {
  const res = await apiFetch(`/taches/${tacheId}/sous-taches`);
  if (!res.ok) return [];
  return res.json();
}

export async function createSousTache(tacheId, titre) {
  const res = await apiFetch(`/taches/${tacheId}/sous-taches`, {
    method: "POST",
    body: JSON.stringify({ titre }),
  });
  if (!res.ok) throw new Error("Erreur création sous-tâche");
  return res.json();
}

export async function toggleSousTache(tacheId, sousTacheId) {
  const res = await apiFetch(
    `/taches/${tacheId}/sous-taches/${sousTacheId}/toggle`,
    { method: "PATCH" },
  );
  if (!res.ok) throw new Error("Erreur toggle sous-tâche");
  return res.json();
}

export async function deleteSousTache(tacheId, sousTacheId) {
  await apiFetch(`/taches/${tacheId}/sous-taches/${sousTacheId}`, {
    method: "DELETE",
  });
}

// ─── Notifications ─────────────────────────────────────────────────────────
export async function getNotifications() {
  const res = await apiFetch("/notifications/me");
  if (!res.ok) return [];
  return res.json();
}

export async function markNotifRead(id) {
  await apiFetch(`/notifications/${id}/lue`, { method: "PATCH" });
}

export async function markAllNotifsRead() {
  await apiFetch("/notifications/me/toutes-lues", { method: "PATCH" });
}

// ─── Utilisateurs ──────────────────────────────────────────────────────────
export async function getDevelopeurs() {
  const res = await apiFetch("/users/role/DEVELOPPEUR");
  if (!res.ok) return [];
  return res.json();
}

// ─── Problèmes ─────────────────────────────────────────────────────────────
export async function getMesProblemes() {
  const res = await apiFetch("/problemes/mine");
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
