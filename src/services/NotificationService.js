// src/services/NotificationService.js
// ✅ Zéro expo-notifications — polling pur, fonctionne dans Expo Go SDK 53/54
import { Alert } from "react-native";
import { getNotifications } from "../api/api";

let _interval = null;
let _knownIds = new Set();
let _initialized = false;
let _listeners = [];

// ── Démarrer le polling ────────────────────────────────────────────────────
export function startPolling() {
  if (_interval) return;
  _poll();
  _interval = setInterval(_poll, 30000);
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

// ── Forcer un refresh immédiat ─────────────────────────────────────────────
export async function refreshNow() {
  return _poll();
}

// ── S'abonner aux nouvelles notifs (pour le badge) ────────────────────────
export function subscribeToNotifs(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter((l) => l !== callback);
  };
}

// ── Compter les non lues ───────────────────────────────────────────────────
export async function getUnreadCount() {
  try {
    const notifs = await getNotifications();
    if (!Array.isArray(notifs)) return 0;
    return notifs.filter((n) => !n.lue).length;
  } catch {
    return 0;
  }
}

// ── Poll interne ───────────────────────────────────────────────────────────
async function _poll() {
  try {
    const notifs = await getNotifications();
    if (!Array.isArray(notifs) || notifs.length === 0) return;

    if (!_initialized) {
      // ✅ PREMIER CHARGEMENT :
      // Alerter les notifs NON LUES existantes (déjà en attente)
      const nonLues = notifs.filter((n) => !n.lue);

      // Mémoriser toutes les notifs pour les polls suivants
      notifs.forEach((n) => _knownIds.add(n.id));
      _initialized = true;

      if (nonLues.length > 0) {
        _listeners.forEach((cb) => cb(nonLues));
        // Petit délai pour que l'app soit bien chargée avant l'alerte
        setTimeout(() => _afficherAlertes(nonLues), 1500);
      }
      return;
    }

    // ✅ POLLS SUIVANTS :
    // Seulement les notifs dont l'ID n'est pas encore connu
    const nouvelles = notifs.filter((n) => !_knownIds.has(n.id));
    nouvelles.forEach((n) => _knownIds.add(n.id));

    // Parmi les nouvelles → seulement les non lues déclenchent l'alerte
    const aAlerter = nouvelles.filter((n) => !n.lue);
    if (aAlerter.length === 0) return;

    _listeners.forEach((cb) => cb(aAlerter));
    _afficherAlertes(aAlerter);
  } catch {
    /* silencieux */
  }
}

// ── Afficher les alertes ──────────────────────────────────────────────────
function _afficherAlertes(notifs) {
  if (!notifs || notifs.length === 0) return;

  if (notifs.length === 1) {
    // Une seule → Alert simple
    const n = notifs[0];
    Alert.alert(n.titre || "🔔 Nouvelle notification", n.message || "", [
      { text: "OK" },
    ]);
  } else {
    // Plusieurs → résumé groupé
    const lignes = notifs
      .slice(0, 5)
      .map((n) => `• ${n.titre || n.message || "Notification"}`)
      .join("\n");

    Alert.alert(
      `🔔 ${notifs.length} notifications non lues`,
      lignes +
        (notifs.length > 5 ? `\n... et ${notifs.length - 5} autres` : ""),
      [{ text: "OK" }],
    );
  }
}
