import api from "../api";
import { User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "CLIENT" | "BARBER";
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  email: string;
  requiresVerification: boolean;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  verifyOtp: async (email: string, code: string): Promise<AuthResponse> => {
    const { data } = await api.post("/auth/verify-otp", { email, code });
    return data;
  },

  resendOtp: async (email: string): Promise<void> => {
    await api.post("/auth/resend-otp", { email });
  },

  me: async (): Promise<User> => {
    const { data } = await api.get("/auth/me");
    return data.user || data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post("/auth/logout", { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return data;
  },
};
