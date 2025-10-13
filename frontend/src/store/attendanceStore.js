// ============================================
// src/store/attendanceStore.js - Attendance State
// ============================================
import { create } from "zustand";
import api from "../api/axios";


export const useAttendanceStore = create((set) => ({
  todayAttendance: null,
  attendanceHistory: [],
  locations: [],
  loading: false,
  error: null,
  getLocations: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/locations");
      set({ locations: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  getTodayAttendance: async () => {
    try {
      const { data } = await api.get("/attendances/today");
      set({ todayAttendance: data });
      return data;
    } catch (error) {
      console.error("Failed to fetch today's attendance:", error);
    }
  },
  getAttendanceHistory: async (limit = 30, startDate, endDate) => {
    set({ loading: true });
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { data } = await api.get("/attendances/history", { params });
      set({ attendanceHistory: data, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  checkIn: async (latitude, longitude, locationId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/attendances/check-in", {
        latitude,
        longitude,
        locationId,
      });
      set({ todayAttendance: data.attendance, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || "Check-in failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  checkOut: async (latitude, longitude) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post("/attendances/check-out", {
        latitude,
        longitude,
      });
      set({ todayAttendance: data.attendance, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || "Check-out failed";
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
