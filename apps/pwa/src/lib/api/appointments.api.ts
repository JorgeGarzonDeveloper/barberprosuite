import api from "../api";
import { Appointment, PaginatedResponse } from "@/types";

export interface AppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const appointmentsApi = {
  getMy: async (
    params?: AppointmentsParams
  ): Promise<PaginatedResponse<Appointment>> => {
    const { data } = await api.get("/appointments/my", { params });
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return { data: list, total: list.length };
  },

  getBarber: async (
    params?: AppointmentsParams
  ): Promise<PaginatedResponse<Appointment>> => {
    const { data } = await api.get("/appointments/barber", { params });
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return { data: list, total: list.length };
  },

  cancel: async (id: string): Promise<void> => {
    await api.patch(`/appointments/${id}/cancel`);
  },

  confirm: async (id: string): Promise<void> => {
    await api.patch(`/appointments/${id}/confirm`);
  },

  complete: async (id: string): Promise<void> => {
    await api.patch(`/appointments/${id}/complete`);
  },
};
