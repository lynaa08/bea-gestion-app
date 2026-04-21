# BEA Tasks — Application Mobile React Native

Application mobile pour la gestion des tâches et projets BEA.

## Prérequis

- Node.js 18+
- Expo CLI : `npm install -g expo-cli`
- Application **Expo Go** sur votre téléphone (iOS ou Android)
- Backend Spring Boot lancé sur le port 8082

## Installation

```bash
npm install
```

## Configuration importante ⚠️

Avant de lancer, modifiez `src/api/api.js` :

```js
// Remplacez XX par l'IP de votre PC
// Windows : ipconfig → Adresse IPv4
export const BASE_URL = 'http://192.168.1.XX:8082/api';
```

**Votre téléphone et votre PC doivent être sur le même WiFi.**

## Lancer l'application

```bash
npx expo start
```

Scannez le QR code avec Expo Go.

## Structure

```
src/
├── api/
│   └── api.js              ← Appels backend Spring Boot
├── context/
│   └── AuthContext.js      ← Token JWT + rôles
├── navigation/
│   └── AppNavigator.js     ← Navigation selon le rôle
└── screens/
    ├── LoginScreen.js
    ├── DashboardScreen.js
    ├── TachesScreen.js
    ├── ProjetDetailScreen.js
    ├── NotificationsScreen.js
    └── ProblemeScreen.js
```

## Comptes de test

| Matricule | Mot de passe | Rôle |
|-----------|-------------|------|
| ADM001    | admin123    | Admin |
| DIR001    | dir123      | Directeur |
| CDEP001   | cdep123     | Chef Département |
| PMO001    | pmo123      | PMO |
| DEV001    | dev123      | Développeur |

## Backend

Le backend Spring Boot doit tourner sur `http://localhost:8082`.
Depuis le téléphone, utilisez l'IP locale du PC (pas localhost).
