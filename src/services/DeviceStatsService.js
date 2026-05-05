// src/services/DeviceStatsService.js
// ✅ Batterie + Stockage + Réseau EXACT (octets mesurés) + Énergie estimée
//
// npx expo install expo-battery expo-file-system expo-network

import * as Battery from "expo-battery";
import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";
import {
  logNetworkSummary,
  getNetworkStats,
  resetNetworkStats,
} from "./NetworkTracker";

let _interval = null;
let _startTime = null;

// ── Démarrer le logging ────────────────────────────────────────────────────
export function startDeviceStatsLogging() {
  if (_interval) return;
  _startTime = Date.now();
  resetNetworkStats();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║         BEA Tasks — Device Monitor START        ║");
  console.log("║  Chaque appel API : ↑ envoyé  ↓ reçu  total    ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  _logStats();
  _interval = setInterval(_logStats, 60000);
}

// ── Arrêter le logging ─────────────────────────────────────────────────────
export function stopDeviceStatsLogging() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  _logSummary();
  _startTime = null;
}

// ── Log toutes les 60s ────────────────────────────────────────────────────
async function _logStats() {
  const now = new Date().toLocaleTimeString("fr-FR");
  const elapsedMin = _startTime
    ? ((Date.now() - _startTime) / 60000).toFixed(1)
    : 0;

  console.log(`\n┌──────────────────────────────────────────────────`);
  console.log(`│   BEA Tasks Stats — ${now}`);
  console.log(`├──────────────────────────────────────────────────`);

  // 1️⃣ Batterie
  try {
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    const pct = Math.round(level * 100);
    const icon = pct > 60 ? "🟢" : pct > 20 ? "🟡" : "🔴";
    console.log(
      `│   Batterie    : ${icon} ${pct}% — ${_batteryLabel(state)}`,
    );
  } catch {
    console.log(`│   Batterie    : Non disponible (Expo Go)`);
  }

  // 2️⃣ Stockage
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    const total = await FileSystem.getTotalDiskCapacityAsync();
    const fGB = (free / 1024 / 1024 / 1024).toFixed(2);
    const tGB = (total / 1024 / 1024 / 1024).toFixed(2);
    const used = Math.round(((total - free) / total) * 100);
    const icon = used < 70 ? "🟢" : used < 90 ? "🟡" : "🔴";
    console.log(
      `│   Stockage    : ${icon} ${fGB} GB libres / ${tGB} GB (${used}% utilisé)`,
    );
  } catch {
    console.log(`│   Stockage    : Non disponible`);
  }

  // 3️⃣ Type de réseau
  try {
    const net = await Network.getNetworkStateAsync();
    const type = net.type || "UNKNOWN";
    const conn = net.isConnected ? "✅" : "❌";
    const icon = type.includes("WIFI")
      ? ""
      : type.includes("CELLULAR")
        ? "📡"
        : "🔌";
    console.log(
      `│  ${icon} Connexion   : ${conn} ${type} — Internet: ${net.isInternetReachable ? "OK" : "KO"}`,
    );
  } catch {
    console.log(`│   Connexion   : Non disponible`);
  }

  // 4️⃣ ✅ Données réseau EXACTES (octets mesurés par trackedFetch)
  logNetworkSummary();

  // 5️⃣ Énergie estimée
  const stats = getNetworkStats();
  const estMah = ((elapsedMin / 10) * 5 + stats.callCount * 0.15).toFixed(2);
  console.log(`│   Énergie      : ~${estMah} mAh estimés`);
  console.log(`│   Session      : ${elapsedMin} minutes`);
  console.log(`└──────────────────────────────────────────────────\n`);
}

// ── Résumé final à la déconnexion ─────────────────────────────────────────
function _logSummary() {
  const elapsedMin = _startTime
    ? ((Date.now() - _startTime) / 60000).toFixed(1)
    : 0;
  const stats = getNetworkStats();
  const cout = (parseFloat(stats.totalMB) * 0.5).toFixed(6);

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║         BEA Tasks — Session Summary             ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║    Durée            : ${elapsedMin} minutes`);
  console.log(`║    Appels API       : ${stats.callCount}`);
  console.log(`║    Données envoyées : ${stats.sentKB} KB`);
  console.log(`║    Données reçues   : ${stats.receivedKB} KB`);
  console.log(
              `║    Total réseau     : ${stats.totalKB} KB (${stats.totalMB} MB)`,
  );
  console.log(`║    Coût estimé      : ~${cout} DZD`);
  console.log("╚══════════════════════════════════════════════════╝\n");
}

function _batteryLabel(state) {
  switch (state) {
    case Battery.BatteryState.CHARGING:
      return "En charge 🔌";
    case Battery.BatteryState.FULL:
      return "Complète ";
    case Battery.BatteryState.UNPLUGGED:
      return "Sur batterie";
    default:
      return "Inconnu";
  }
}
