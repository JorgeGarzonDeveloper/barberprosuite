import api from "../api";
import { AdminDashboard, User, Barbershop, Appointment, Subscription, PaginatedResponse } from "@/types";

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboard> => {
    const { data } = await api.get("/admin/dashboard");
    return data;
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> => {
    const { data } = await api.get("/admin/users", { params });
    return data;
  },

  getBarbershops: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Barbershop>> => {
    const { data } = await api.get("/admin/barbershops", { params });
    return data;
  },

  getAppointments: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Appointment>> => {
    const { data } = await api.get("/admin/appointments", { params });
    return data;
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
    return data;
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
