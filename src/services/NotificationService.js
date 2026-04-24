// src/services/NotificationService.js
// ✅ Zéro expo-notifications — fonctionne dans Expo Go SDK 53/54
// Système de polling : vérifie les nouvelles notifs toutes les 30s

import { getNotifications } from "../api/api";

let _interval = null;
let _knownIds = new Set();
let _initialized = false;
let _listeners = []; // callbacks enregistrés

// ── Démarrer le polling ────────────────────────────────────────────────────
export function startPolling() {
  if (_interval) return; // déjà démarré

  _poll(); // premier appel immédiat
  _interval = setInterval(_poll, 30000); // puis toutes les 30s
}

// ── Arrêter le polling ─────────────────────────────────────────────────────
export function stopPolling() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  _knownIds.clear();
  _initialized = false;
  _listeners = [];
}

// ── S'abonner aux nouvelles notifications ─────────────────────────────────
// callback(nouvelles) sera appelé avec la liste des nouvelles notifs
export function subscribeToNotifs(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter((l) => l !== callback);
  };
}

// ── Poll interne ───────────────────────────────────────────────────────────
async function _poll() {
  try {
    const notifs = await getNotifications();
    if (!Array.isArray(notifs) || notifs.length === 0) return;

    if (!_initialized) {
      // Premier appel : mémoriser les IDs existants, ne pas notifier
      notifs.forEach((n) => _knownIds.add(n.id));
      _initialized = true;
      return;
    }

    // Trouver les nouvelles notifs non lues
    const nouvelles = notifs.filter((n) => !_knownIds.has(n.id) && !n.lue);
    nouvelles.forEach((n) => _knownIds.add(n.id));

    if (nouvelles.length > 0) {
      // Appeler tous les abonnés (ex: mettre à jour le badge)
      _listeners.forEach((cb) => cb(nouvelles));
    }
  } catch (e) {
    // Silencieux — l'user peut être déconnecté
  }
}

// ── Compter les notifs non lues (pour le badge) ───────────────────────────
export async function getUnreadCount() {
  try {
    const notifs = await getNotifications();
    if (!Array.isArray(notifs)) return 0;
    return notifs.filter((n) => !n.lue).length;
  } catch {
    return 0;
  }
}
