import axios from "axios";
import { globalToast } from "@/components/ui/Toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ─── Extrae un mensaje legible de cualquier error Axios ─────────────────────
export function parseApiError(error: any): string {
  if (!error.response) {
    return "Sin conexión con el servidor. Verifica tu internet.";
  }
  const data = error.response.data;
  if (data?.error) {
    const e = Array.isArray(data.error) ? data.error[0] : data.error;
    return humanize(e);
  }
  if (data?.message) {
    const m = Array.isArray(data.message) ? data.message[0] : data.message;
    return humanize(m);
  }
  return HTTP_MESSAGES[error.response.status] ?? "Error inesperado. Intenta de nuevo.";
}

// Mensajes amigables por código HTTP
const HTTP_MESSAGES: Record<number, string> = {
  400: "Los datos enviados no son válidos.",
  401: "Debes iniciar sesión para continuar.",
  403: "No tienes permiso para realizar esta acción.",
  404: "El recurso solicitado no existe.",
  409: "Ya existe un registro con esos datos.",
  422: "Los datos enviados son incorrectos.",
  429: "Demasiadas solicitudes. Espera un momento.",
  500: "Error interno del servidor. Inténtalo más tarde.",
  502: "El servidor no está disponible. Inténtalo más tarde.",
  503: "Servicio temporalmente no disponible.",
};

// Traduce mensajes técnicos del backend a español claro
function humanize(msg: string): string {
  if (!msg) return "Error inesperado.";
  const map: Record<string, string> = {
    Unauthorized: "Debes iniciar sesión para continuar.",
    Forbidden: "No tienes permiso para realizar esta acción.",
    "Not Found": "El recurso solicitado no existe.",
    "Bad Request": "Los datos enviados no son válidos.",
    "Internal Server Error": "Error interno del servidor.",
    "No autorizado": "Debes iniciar sesión para continuar.",
    "No tienes permiso": "No tienes permiso para realizar esta acción.",
  };
  return map[msg] ?? msg;
}

// ─── Request interceptor — adjunta token JWT ────────────────────────────────
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor — refresh token + toast de errores ────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Intentar renovar token en 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken,
          });
          const { accessToken } = res.data.data;
          localStorage.setItem("accessToken", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/admin/login";
          }
          return Promise.reject(error);
        }
      }
    }

    // No mostrar toast para 401 (ya maneja el redirect) ni para peticiones silenciosas
    const status = error.response?.status;
    const silent = originalRequest._silent;
    if (!silent && status !== 401) {
      const message = parseApiError(error);
      // Solo mostrar toast para errores del servidor (5xx) o forbidden (403/409)
      // Los errores de validación (400/422) los manejan los formularios localmente
      if (status && (status >= 500 || status === 403 || status === 409)) {
        globalToast("error", HTTP_MESSAGES[status] ?? "Error del servidor", message !== HTTP_MESSAGES[status] ? message : undefined);
      }
    }

    return Promise.reject(error);
  }
);
