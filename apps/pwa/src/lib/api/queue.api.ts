import api from "../api";
import { Barber, MyQueueResponse, QueueEntry } from "@/types";

export interface JoinQueuePayload {
  barbershopId: string;
  qrSecret: string;
  latitude: number;
  longitude: number;
  preferredBarberId?: string;
}

export const queueApi = {
  join: async (payload: JoinQueuePayload): Promise<{ entry: QueueEntry }> => {
    const { data } = await api.post("/queue/join", payload);
    return data;
  },

  getMyQueue: async (): Promise<MyQueueResponse> => {
    const { data } = await api.get("/queue/my-queue");
    return data;
  },

  getMyEntry: async (): Promise<{ entry: QueueEntry }> => {
    const { data } = await api.get("/queue/my-entry");
    return data;
  },

  getBarbers: async (barbershopId: string): Promise<{ data: Barber[] }> => {
    const { data } = await api.get(`/queue/barbers/${barbershopId}`);
    return data;
  },

  callNext: async (): Promise<void> => {
    await api.post("/queue/call-next-mine");
  },

  completeCurrent: async (): Promise<void> => {
    await api.post("/queue/complete-current");
  },

  leave: async (entryId: string): Promise<void> => {
    await api.delete(`/queue/leave/${entryId}`);
  },

  updateLocation: async (payload: {
    queueEntryId: string;
    latitude: number;
    longitude: number;
  }): Promise<void> => {
    await api.patch("/queue/location", payload);
  },
};
