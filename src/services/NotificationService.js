// src/services/NotificationService.js
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getNotifications } from "../api/api";

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

export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default", data },
    trigger: null,
  });
}

let _pollingInterval = null;
let _lastNotifIds = new Set();

export function startNotifPolling(onNewNotif) {
  if (_pollingInterval) return;
  _pollOnce(onNewNotif);
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

// ✅ Bug 1 — fonction manquante ajoutée
export async function refreshNow(onNewNotif) {
  await _pollOnce(onNewNotif);
}

async function _pollOnce(onNewNotif) {
  try {
    const notifs = await getNotifications();
    if (!notifs || !notifs.length) return;

    if (_lastNotifIds.size === 0) {
      notifs.forEach((n) => _lastNotifIds.add(n.id));
      return;
    }

    const nouvelles = notifs.filter((n) => !_lastNotifIds.has(n.id) && !n.lue);
    for (const n of nouvelles) {
      _lastNotifIds.add(n.id);
      await sendLocalNotification(
        n.titre || "📋 Nouvelle notification",
        n.message || "",
        { notifId: n.id, projetId: n.projetId },
      );
      if (onNewNotif) onNewNotif(n);
    }
  } catch (e) {}
}
