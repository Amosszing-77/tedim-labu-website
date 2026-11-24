// src/services/api.js
import axios from "axios";

const BASE_URL = "https://tedim-labu-server-26.vercel.app";

// Create a customized Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Build full URL for a relative upload path (e.g. /uploads/songs/xxx.pdf)
export const resolveFileUrl = (url) =>
  url?.startsWith("http") ? url : `${BASE_URL}${url}`;

// ----- Generic response interceptor -----
// This ensures that even with Axios, we return the same shape as before
// so we don't have to rewrite the .then() logic in our components.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Extract the error message from your backend's error handler
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

// ============================================
// SONGS
// ============================================
export const songApi = {
  list: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v),
    );
    return api.get("/api/songs", { params: cleanParams });
  },

  get: (id) => api.get(`/api/songs/${id}`),

  create: (payload) => api.post("/api/songs", payload),

  toggleStatus: (id) => api.patch(`/api/songs/${id}/status`),

  delete: (id) => api.delete(`/api/songs/${id}`),
};

// ============================================
// RELEASES
// ============================================
export const releaseApi = {
  list: (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v),
    );
    return api.get("/api/releases", { params: cleanParams });
  },

  create: (payload) => api.post("/api/releases", payload),

  update: (id, payload) => api.put(`/api/releases/${id}`, payload),

  toggleStatus: (id) => api.patch(`/api/releases/${id}/status`),

  delete: (id) => api.delete(`/api/releases/${id}`),
};
