  import axios from "axios";

  export const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
  });

  API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    console.log("Interceptor: token =", token, "url =", config.url);

    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register");

    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
