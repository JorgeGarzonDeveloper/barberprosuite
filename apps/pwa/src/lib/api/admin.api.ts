import api from "../api";
import { AdminDashboard, Appointment, Subscription, PaginatedResponse } from "@/types";

export interface UserAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  status: string;
  createdAt: string;
}

export interface BarbershopAdmin {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  email?: string;
  description?: string;
  latitude: number;
  longitude: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  images?: string[];
  owner?: { firstName: string; lastName: string };
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboard> => {
    const { data } = await api.get("/admin/dashboard");
    return data.data ?? data;
  },

  // ── Usuarios ──────────────────────────────────────────────────────────────
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<{ data: UserAdmin[]; total: number }> => {
    const { data } = await api.get("/admin/users", { params });
    return data.data ?? data;
  },

  createBarber: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserAdmin> => {
    const { data } = await api.post("/admin/barbers", payload);
    return data.data ?? data;
  },

  assignBarber: async (userId: string, barbershopId: string): Promise<void> => {
    await api.post(`/admin/barbers/${userId}/assign/${barbershopId}`);
  },

  toggleUserStatus: async (userId: string, currentStatus: string): Promise<void> => {
    await api.patch(`/admin/users/${userId}/status`, {
      status: currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
    });
  },

  // ── Barberías ─────────────────────────────────────────────────────────────
  getBarbershops: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }): Promise<{ data: BarbershopAdmin[]; total: number }> => {
    const { data } = await api.get("/barbershops", { params });
    return data.data ?? data;
  },

  createBarbershop: async (payload: Record<string, unknown>): Promise<BarbershopAdmin> => {
    const { data } = await api.post("/barbershops", payload);
    return data.data ?? data;
  },

  updateBarbershop: async (id: string, payload: Record<string, unknown>): Promise<BarbershopAdmin> => {
    const { data } = await api.patch(`/barbershops/${id}`, payload);
    return data.data ?? data;
  },

  getBarbershopQr: async (id: string): Promise<string | null> => {
    const { data } = await api.get(`/barbershops/${id}/qr`);
    return data?.data?.qrImage ?? data?.qrImage ?? null;
  },

  uploadBarbershopImages: async (id: string, files: File[]): Promise<void> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    await api.post(`/barbershops/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteBarbershopImage: async (id: string, imageUrl: string): Promise<void> => {
    await api.delete(`/barbershops/${id}/images`, { data: { imageUrl } });
  },

  // ── Citas ─────────────────────────────────────────────────────────────────
  getAppointments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Appointment>> => {
    const { data } = await api.get("/admin/appointments", { params });
    return data.data ?? data;
  },

  getQueues: async (): Promise<{ data: unknown[] }> => {
    const { data } = await api.get("/admin/queue");
    return data;
  },

  getSubscriptions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Subscription>> => {
    const { data } = await api.get("/admin/subscriptions", { params });
    return data.data ?? data;
  },

  sendNotification: async (payload: {
    title: string;
    body: string;
    userIds?: string[];
    roles?: string[];
  }): Promise<void> => {
    await api.post("/admin/notifications/send", payload);
  },

  getSettings: async (): Promise<Record<string, unknown>> => {
    const { data } = await api.get("/admin/settings");
    return data;
  },

  updateSettings: async (
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> => {
    const { data } = await api.patch("/admin/settings", payload);
    return data;
  },
};
