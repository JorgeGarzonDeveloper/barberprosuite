import api from "../api";
import { BarberService } from "@/types";

export interface CreateServicePayload {
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export const barberApi = {
  getServicesByBarber: async (
    barberId: string
  ): Promise<{ data: BarberService[] }> => {
    const { data } = await api.get(`/barber/services/by-barber/${barberId}`);
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return { data: list };
  },

  getMyServices: async (): Promise<{ data: BarberService[] }> => {
    const { data } = await api.get("/barber/services");
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return { data: list };
  },

  createService: async (
    payload: CreateServicePayload
  ): Promise<BarberService> => {
    const { data } = await api.post("/barber/services", payload);
    return data;
  },

  updateService: async (
    id: string,
    payload: Partial<CreateServicePayload>
  ): Promise<BarberService> => {
    const { data } = await api.patch(`/barber/services/${id}`, payload);
    return data;
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/barber/services/${id}`);
  },
};
