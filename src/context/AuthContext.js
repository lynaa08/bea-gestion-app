import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as apiLogin } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userData = await AsyncStorage.getItem("user");
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (e) {
        console.error("AuthContext init error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(matricule, password) {
    const data = await apiLogin(matricule, password);
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  }

  async function logout() {
    await AsyncStorage.multiRemove(["token", "user"]);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// ── Rôles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: "ADMIN",
  DIRECTEUR: "DIRECTEUR",
  CHEF_DEPARTEMENT: "CHEF_DEPARTEMENT",
  PMO: "INGENIEUR_ETUDE_PMO",
  DEV: "DEVELOPPEUR",
  CONSULTANT: "CONSULTANT",
};

// Vérifier si l'utilisateur a un des rôles donnés
export function hasRole(user, ...roles) {
  return !!(user && roles.includes(user.role));
}

// Le développeur peut créer ses propres tâches
// Les managers peuvent aussi créer des tâches
export function canCreateTache(user) {
  return hasRole(
    user,
    ROLES.DEV,
    ROLES.PMO,
    ROLES.ADMIN,
    ROLES.DIRECTEUR,
    ROLES.CHEF_DEPARTEMENT,
  );
}

// Seuls les managers peuvent voir toutes les tâches
export function isManager(user) {
  return hasRole(
    user,
    ROLES.PMO,
    ROLES.ADMIN,
    ROLES.DIRECTEUR,
    ROLES.CHEF_DEPARTEMENT,
  );
}
