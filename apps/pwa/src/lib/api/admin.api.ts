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
    const { data } = await api.get("/admin/barbershops", { params });
    // Handle { data: { data: [], total: N } } and { data: [], total: N }
    const inner = data?.data;
    if (inner && !Array.isArray(inner) && Array.isArray(inner.data)) {
      return inner; // { data: [], total: N }
    }
    if (Array.isArray(inner)) {
      return { data: inner, total: data.total ?? inner.length };
    }
    return data;
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

  updateSubscription: async (id: string, payload: { status?: string; endDate?: string }): Promise<void> => {
    await api.patch(`/admin/subscriptions/${id}`, payload);
  },

  sendNotification: async (payload: {
    title: string;
    body: string;
    userIds?: string[];
    roles?: string[];
  }): Promise<void> => {
    await api.post("/admin/notifications/send", payload);
  },

  // ── Cuadre de pagos ──────────────────────────────────────────────────────
  getPayouts: async (statusFilter?: string): Promise<{ barbershops: unknown[]; totalOwed: number; payoutRecords: unknown[] }> => {
    const { data } = await api.get("/admin/payouts", { params: statusFilter ? { status: statusFilter } : undefined });
    return data?.data ?? data;
  },

  getPayoutTransactions: async (params?: { barbershopId?: string }): Promise<unknown[]> => {
    const { data } = await api.get("/admin/payouts/transactions", { params });
    return data?.data ?? data ?? [];
  },

  createPayoutRecord: async (payload: { barberId: string; barbershopId?: string; amount: number; notes?: string }): Promise<unknown> => {
    const { data } = await api.post("/admin/payouts/record", payload);
    return data?.data ?? data;
  },

  updatePayoutRecord: async (id: string, payload: { status?: string; notes?: string; proofUrl?: string }): Promise<void> => {
    await api.patch(`/admin/payouts/record/${id}`, payload);
  },

  uploadPayoutProof: async (id: string, file: File): Promise<{ proofUrl: string }> => {
    const formData = new FormData();
    formData.append("proof", file);
    const { data } = await api.post(`/admin/payouts/record/${id}/proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.data ?? data;
  },

  deletePayoutRecord: async (id: string): Promise<void> => {
    await api.delete(`/admin/payouts/record/${id}`);
  },

  // ── Devoluciones ─────────────────────────────────────────────────────────
  getRefunds: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ data: unknown[]; total: number }> => {
    const { data } = await api.get("/admin/refunds", { params });
    const inner = data?.data;
    if (inner && Array.isArray(inner.data)) return inner;
    if (Array.isArray(inner)) return { data: inner, total: data.total ?? inner.length };
    return { data: Array.isArray(data) ? data : [], total: 0 };
  },

  approveRefund: async (id: string): Promise<void> => {
    await api.post(`/admin/refunds/${id}/process`, { action: "approve" });
  },

  rejectRefund: async (id: string, adminNote?: string): Promise<void> => {
    await api.post(`/admin/refunds/${id}/process`, { action: "reject", adminNote });
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
