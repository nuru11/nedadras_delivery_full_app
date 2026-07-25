import axios from "axios";

const api = axios.create({
  baseURL: "https://deliveryappapi.negadrasexpress.net/api",
  // baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// const api = axios.create({
//   baseURL:
//     import.meta.env.VITE_API_URL || "http://localhost:4000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
