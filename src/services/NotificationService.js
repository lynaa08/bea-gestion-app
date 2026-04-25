// src/services/NotificationService.js
// ✅ Push notifications locales + polling backend (pour DEVELOPPEUR)
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getNotifications } from "../api/api";

// Afficher la notif même si l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
export async function getUnreadCount() {
  try {
    const notifs = await getNotifications();
    if (!notifs) return 0;

    return notifs.filter((n) => !n.lue).length;
  } catch (e) {
    return 0;
  }
}

// ─── Demander la permission (appeler au démarrage) ─────────────────────────
export async function requestNotifPermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("bea-tasks", {
      name: "BEA Tasks",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ─── Envoyer une notification locale immédiate ─────────────────────────────
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data,
    },
    trigger: null, // immédiatement
  });
}

// ─── Polling : vérifie les nouvelles notifications backend ────────────────
// Appeler uniquement pour DEVELOPPEUR
let _pollingInterval = null;
let _lastNotifIds = new Set();

export function startNotifPolling(onNewNotif) {
  if (_pollingInterval) return; // déjà lancé

  // Première vérification immédiate
  _pollOnce(onNewNotif);

  // Puis toutes les 30 secondes
  _pollingInterval = setInterval(() => {
    _pollOnce(onNewNotif);
  }, 30000);
}

export function stopNotifPolling() {
  if (_pollingInterval) {
    clearInterval(_pollingInterval);
    _pollingInterval = null;
  }
  _lastNotifIds.clear();
}

async function _pollOnce(onNewNotif) {
  try {
    const notifs = await getNotifications();
    if (!notifs || !notifs.length) return;

    // Initialisation : ne pas notifier les anciennes au premier appel
    if (_lastNotifIds.size === 0) {
      notifs.forEach((n) => _lastNotifIds.add(n.id));
      return;
    }

    // Trouver les nouvelles (id pas encore vus + pas lues)
    const nouvelles = notifs.filter((n) => !_lastNotifIds.has(n.id) && !n.lue);

    for (const n of nouvelles) {
      _lastNotifIds.add(n.id);

      // Déclencher push locale
      await sendLocalNotification(
        n.titre || "📋 Nouvelle notification",
        n.message || "",
        { notifId: n.id, projetId: n.projetId },
      );

      // Callback optionnel pour rafraîchir l'UI
      if (onNewNotif) onNewNotif(n);
    }
  } catch (e) {
    // Silencieux — l'utilisateur peut être déconnecté
  }
}
