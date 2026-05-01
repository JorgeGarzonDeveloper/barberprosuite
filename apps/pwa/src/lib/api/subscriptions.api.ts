import api from "../api";
import { Plan, Subscription } from "@/types";

export const subscriptionsApi = {
  getMy: async (): Promise<{ data: Subscription }> => {
    const { data } = await api.get("/subscriptions/my");
    return data;
  },

  getPlans: async (): Promise<{ data: Plan[] }> => {
    const { data } = await api.get("/subscriptions/plans");
    return data;
  },

  subscribe: async (planId: string): Promise<void> => {
    await api.post(`/subscriptions/user/subscribe/${planId}`);
  },
};
