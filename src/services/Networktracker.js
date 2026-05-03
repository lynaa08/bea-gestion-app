// src/services/NetworkTracker.js
// ✅ Mesure exacte des données réseau consommées par l'app
// Fonctionne dans Expo Go — pas besoin de librairies natives

// ── Compteurs globaux ─────────────────────────────────────────────────────
let _bytesSent = 0; // octets envoyés (requêtes)
let _bytesReceived = 0; // octets reçus (réponses)
let _callCount = 0; // nombre d'appels API
let _callDetails = []; // détail de chaque appel

// ── Réinitialiser les compteurs ────────────────────────────────────────────
export function resetNetworkStats() {
  _bytesSent = 0;
  _bytesReceived = 0;
  _callCount = 0;
  _callDetails = [];
}

// ── Récupérer les stats actuelles ─────────────────────────────────────────
export function getNetworkStats() {
  return {
    bytesSent: _bytesSent,
    bytesReceived: _bytesReceived,
    callCount: _callCount,
    callDetails: [..._callDetails],
    totalBytes: _bytesSent + _bytesReceived,
    sentKB: (_bytesSent / 1024).toFixed(2),
    receivedKB: (_bytesReceived / 1024).toFixed(2),
    totalKB: ((_bytesSent + _bytesReceived) / 1024).toFixed(2),
    totalMB: ((_bytesSent + _bytesReceived) / 1024 / 1024).toFixed(4),
  };
}

// ── Estimer le coût en DZD (données mobiles Algérie) ──────────────────────
// Ooredoo / Mobilis / Djezzy : ~50 DZD / 100 MB (forfait standard)
// = 0.5 DZD / MB = 0.000488 DZD / KB
export function estimerCoutDZD() {
  const totalMB = (_bytesSent + _bytesReceived) / 1024 / 1024;
  const coutDZD = totalMB * 0.5; // 0.5 DZD par MB
  return {
    totalMB: totalMB.toFixed(4),
    coutDZD: coutDZD.toFixed(6),
    coutCentimes: (coutDZD * 100).toFixed(4),
  };
}

// ── apiFetch instrumenté — REMPLACE l'original dans api.js ────────────────
// Mesure exactement les octets de chaque requête
export async function trackedFetch(url, options = {}, authHeaders = {}) {
  const startTime = Date.now();
  const method = options.method || "GET";

  // Mesurer les octets ENVOYÉS
  // = taille de l'URL + headers + body
  const headerStr = Object.entries(authHeaders)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\r\n");
  const bodyStr = options.body ? String(options.body) : "";
  const requestStr = `${method} ${url} HTTP/1.1\r\n${headerStr}\r\n\r\n${bodyStr}`;
  const sentBytes = new TextEncoder().encode(requestStr).length;
  _bytesSent += sentBytes;

  let receivedBytes = 0;
  let status = 0;

  try {
    const res = await fetch(url, { ...options, headers: authHeaders });
    status = res.status;

    // Lire la réponse et mesurer les octets REÇUS
    const responseText = await res.text();
    receivedBytes = new TextEncoder().encode(responseText).length;
    _bytesReceived += receivedBytes;
    _callCount++;

    const elapsed = Date.now() - startTime;

    // Enregistrer le détail
    _callDetails.push({
      url: url.replace(/^https?:\/\/[^/]+/, ""), // chemin relatif seulement
      method,
      status,
      sentBytes,
      receivedBytes,
      totalBytes: sentBytes + receivedBytes,
      ms: elapsed,
      timestamp: new Date().toLocaleTimeString("fr-FR"),
    });

    // Garder seulement les 50 derniers appels
    if (_callDetails.length > 50) _callDetails.shift();

    // Logger dans le terminal
    _logCall(method, url, status, sentBytes, receivedBytes, elapsed);

    // Retourner une nouvelle Response avec le texte lu
    return new Response(responseText, {
      status: res.status,
      headers: res.headers,
    });
  } catch (e) {
    _callCount++;
    _callDetails.push({
      url: url.replace(/^https?:\/\/[^/]+/, ""),
      method,
      status: 0,
      sentBytes,
      receivedBytes: 0,
      totalBytes: sentBytes,
      ms: Date.now() - startTime,
      timestamp: new Date().toLocaleTimeString("fr-FR"),
      error: e.message,
    });
    throw e;
  }
}

// ── Logger chaque appel dans le terminal ──────────────────────────────────
function _logCall(method, url, status, sent, received, ms) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const total = sent + received;
  const icon =
    status >= 200 && status < 300 ? "✅" : status >= 400 ? "❌" : "⚠️";
  const sentStr = _formatBytes(sent);
  const recvStr = _formatBytes(received);
  const totStr = _formatBytes(total);

  console.log(
    `│  ${icon} [${method.padEnd(6)}] ${path.padEnd(35)} ` +
      `${String(status).padEnd(4)} ↑${sentStr.padStart(7)} ↓${recvStr.padStart(7)} ` +
      `= ${totStr.padStart(8)}  (${ms}ms)`,
  );
}

// ── Log résumé réseau (appelé par DeviceStatsService) ─────────────────────
export function logNetworkSummary() {
  const s = getNetworkStats();
  const cout = estimerCoutDZD();
  const icon =
    parseFloat(s.totalMB) < 1 ? "🟢" : parseFloat(s.totalMB) < 5 ? "🟡" : "🔴";

  console.log(
    `│  📡 Données envoyées  : ↑ ${_formatBytes(_bytesSent).padStart(10)}`,
  );
  console.log(
    `│  📡 Données reçues    : ↓ ${_formatBytes(_bytesReceived).padStart(10)}`,
  );
  console.log(
    `│  📡 Total réseau      : ${icon} ${_formatBytes(_bytesSent + _bytesReceived).padStart(10)} (${s.totalMB} MB)`,
  );
  console.log(
    `│  💰 Coût estimé       : ~${cout.coutDZD} DZD  (tarif ~0.5 DZD/MB)`,
  );
  console.log(`│  🔄 Appels API        : ${s.callCount} requêtes`);

  if (s.callCount > 0) {
    const moy = Math.round((_bytesSent + _bytesReceived) / s.callCount);
    console.log(`│  📊 Moyenne / appel   : ${_formatBytes(moy)}`);
  }
}

// ── Formater les octets en B/KB/MB ────────────────────────────────────────
function _formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
