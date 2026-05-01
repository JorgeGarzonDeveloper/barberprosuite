import api from "../api";

export interface AppointmentCheckoutPayload {
  barbershopId: string;
  barberId: string;
  serviceIds: string[];
  scheduledAt: string;
  notes?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  appointmentId: string;
}

export const paymentsApi = {
  appointmentCheckout: async (
    payload: AppointmentCheckoutPayload
  ): Promise<CheckoutResponse> => {
    const { data } = await api.post("/payments/appointment-checkout", payload);
    return data;
  },

  subscriptionCheckout: async (payload: {
    subscriptionId?: string;
    planName: string;
  }): Promise<{ checkoutUrl: string }> => {
    const { data } = await api.post("/payments/checkout-link", payload);
    return data;
  },
};
