import api from "../api";
import { Barbershop } from "@/types";

export interface NearbyParams {
  lat: number;
  lng: number;
  radius?: number;
}

export const barbershopsApi = {
  getNearby: async (params: NearbyParams): Promise<Barbershop[]> => {
    const { data } = await api.get("/barbershops/nearby", { params });
    return data.data || data;
  },

  getById: async (id: string): Promise<Barbershop> => {
    const { data } = await api.get(`/barbershops/${id}`);
    return data;
  },

  postReview: async (
    id: string,
    payload: { rating: number; comment?: string; appointmentId?: string }
  ): Promise<void> => {
    await api.post(`/barbershops/${id}/reviews`, payload);
  },

  canReview: async (
    id: string
  ): Promise<{ canReview: boolean; appointmentId?: string }> => {
    const { data } = await api.get(`/barbershops/${id}/can-review`);
    return data;
  },
};
