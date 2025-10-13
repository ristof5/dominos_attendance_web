// ============================================
// src/store/authStore.js - Auth State Management
// ============================================
import { create } from "zustand";
import api from "../api/axios";
export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,
  register: async (name, email, password, role = "EMPLOYEE") => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });
      set({ loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || "Registration failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.token,
        loading: false,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || "Login failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },
  getProfile: async () => {
    try {
      const { data } = await api.get("/users/profile");
      localStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
      return data;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  },
}));
