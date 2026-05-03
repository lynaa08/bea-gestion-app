// src/services/DeadlineService.js
// ✅ Vérifie les deadlines des tâches et affiche une alerte sur l'écran
// Fonctionne dans Expo Go — utilise Alert.alert natif

import { Alert } from "react-native";
import { getMesTaches } from "../api/api";

let _interval = null;
let _alertedTacheIds = new Set(); // éviter de répéter la même alerte

// ── Démarrer la vérification des deadlines ────────────────────────────────
export function startDeadlineCheck() {
  if (_interval) return;

  // Vérifier immédiatement au login
  _checkDeadlines();

  // Puis toutes les 10 minutes
  _interval = setInterval(_checkDeadlines, 10 * 60 * 1000);
}

// ── Arrêter ───────────────────────────────────────────────────────────────
export function stopDeadlineCheck() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  _alertedTacheIds.clear();
}

// ── Vérification principale ───────────────────────────────────────────────
async function _checkDeadlines() {
  try {
    const taches = await getMesTaches();
    if (!Array.isArray(taches) || taches.length === 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hier = new Date(today);
    hier.setDate(hier.getDate() - 1);

    // Filtrer les tâches à alerter
    const urgentes = []; // deadline = aujourd'hui
    const depassees = []; // deadline dépassée de ≤ 24h (hier)

    for (const t of taches) {
      if (t.statut === "TERMINEE" || t.statut === "ANNULEE") continue;
      if (!t.dateEcheance) continue;
      if (_alertedTacheIds.has(t.id)) continue;

      const echeance = new Date(t.dateEcheance);
      const echeanceDay = new Date(
        echeance.getFullYear(),
        echeance.getMonth(),
        echeance.getDate(),
      );

      const diffMs = echeanceDay - today;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        urgentes.push(t); // deadline aujourd'hui
      } else if (diffDays === -1) {
        depassees.push(t); // deadline dépassée d'exactement 1 jour (24h)
      }
    }

    // Marquer pour ne pas répéter
    [...urgentes, ...depassees].forEach((t) => _alertedTacheIds.add(t.id));

    // Afficher les alertes avec un délai entre chaque
    await _showAlerts(urgentes, depassees);
  } catch (e) {
    // Silencieux — user peut être hors réseau
  }
}

// ── Afficher les alertes ──────────────────────────────────────────────────
async function _showAlerts(urgentes, depassees) {
  // 1. Tâches en retard (deadline dépassée de 24h)
  for (const t of depassees) {
    await _delai(400);
    Alert.alert(
      "⛔ Tâche en retard !",
      `"${t.titre}" devait être terminée hier.\n\n📁 Projet : ${t.projetNom || "—"}\n\nVeuillez la compléter dès que possible ou signaler un problème.`,
      [
        {
          text: "🚨 Signaler un problème",
          style: "destructive",
          onPress: () => {
            // Le user peut naviguer vers ProblemeScreen
            console.log(
              "[DeadlineService] User veut signaler un problème pour :",
              t.titre,
            );
          },
        },
        { text: "OK, compris", style: "cancel" },
      ],
      { cancelable: false },
    );
  }

  // 2. Tâches deadline aujourd'hui
  for (const t of urgentes) {
    await _delai(800); // petit délai pour ne pas empiler les alertes
    Alert.alert(
      "⚠️ Deadline aujourd'hui !",
      `"${t.titre}" doit être terminée aujourd'hui.\n\n📁 Projet : ${t.projetNom || "—"}\n\nOuvre la tâche pour voir les détails.`,
      [
        { text: "Voir la tâche", style: "default" },
        { text: "Plus tard", style: "cancel" },
      ],
    );
  }

  // 3. Résumé groupé si plusieurs tâches
  const total = urgentes.length + depassees.length;
  if (total > 2) {
    await _delai(1200);
    Alert.alert(
      "📋 Résumé deadlines",
      `Vous avez ${total} tâches urgentes :\n` +
        `• ${depassees.length} en retard (deadline dépassée)\n` +
        `• ${urgentes.length} à terminer aujourd'hui\n\n` +
        `Allez dans l'onglet Tâches pour voir le détail.`,
      [{ text: "Voir mes tâches", style: "default" }],
    );
  }
}

function _delai(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
