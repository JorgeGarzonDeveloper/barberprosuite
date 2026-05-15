const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Error en la solicitud");
  return data.data ?? data;
}

async function uploadRequest<T>(path: string, form: FormData): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Error subiendo archivo");
  return data.data ?? data;
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getDashboard: () => request<any>("/admin/dashboard"),
  getRevenue: () => request<any[]>("/admin/revenue"),
  getRevenueBreakdown: () => request<any>("/admin/revenue/breakdown"),

  getUsers: (page = 1, search = "", role = "") =>
    request<any>(`/admin/users?page=${page}&limit=20&search=${search}&role=${role}`),
  updateUserStatus: (id: string, status: string) =>
    request<any>(`/admin/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  createBarber: (data: { firstName: string; lastName: string; email: string; phone: string; password: string }) =>
    request<any>("/admin/barbers", { method: "POST", body: JSON.stringify(data) }),

  getBarbershops: (page = 1, search = "", includeInactive = true) =>
    request<any>(`/barbershops?page=${page}&limit=15&includeInactive=${includeInactive}${search ? `&search=${encodeURIComponent(search)}` : ""}`),
  getBarbershopsAll: () =>
    request<any>("/barbershops?limit=100&includeInactive=true"),
  createBarbershop: (data: any) =>
    request<any>("/barbershops", { method: "POST", body: JSON.stringify(data) }),
  updateBarbershop: (id: string, data: any) =>
    request<any>(`/barbershops/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getBarbershopQR: (id: string) => request<any>(`/barbershops/${id}/qr`),
  uploadBarbershopImages: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    return uploadRequest<any>(`/barbershops/${id}/images`, form);
  },
  deleteBarbershopImage: (id: string, imageUrl: string) =>
    request<any>(`/barbershops/${id}/images`, { method: "DELETE", body: JSON.stringify({ imageUrl }) }),

  getSubscriptions: (page = 1) => request<any>(`/admin/subscriptions?page=${page}&limit=20`),

  getRefunds: (page = 1, status = "") =>
    request<any>(`/admin/refunds?page=${page}&limit=20&status=${status}`),
  processRefund: (id: string, action: "approve" | "reject", adminNote?: string) =>
    request<any>(`/admin/refunds/${id}/process`, {
      method: "POST",
      body: JSON.stringify({ action, adminNote }),
    }),

  getPayouts: () => request<any[]>("/admin/payouts"),
  getTransactionsExport: () => request<any[]>("/admin/transactions/export"),

  assignBarber: (userId: string, barbershopId: string) =>
    request<any>(`/admin/barbers/${userId}/assign/${barbershopId}`, { method: "POST" }),

  // Appointments
  getAppointments: (page = 1, status = "") =>
    request<any>(`/admin/appointments?page=${page}&limit=15${status ? `&status=${status}` : ""}`),
  cancelAppointment: (id: string) =>
    request<any>(`/appointments/${id}/cancel`, { method: "PATCH" }),

  // Queue
  getAdminBarbershops: () => request<any>("/barbershops?limit=100&includeInactive=false"),
  getQueue: (barbershopId: string) => request<any>(`/queue/${barbershopId}`),

  // Notifications
  getNotifications: () => request<any>("/notifications?limit=50"),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: "PATCH" }),
  sendNotificationAll: (payload: { title: string; body: string; type: string }) =>
    request<any>("/notifications/send-all", { method: "POST", body: JSON.stringify(payload) }),

  // Settings (uses regular user token — but admin uses admin_token stored as accessToken locally)
  updateProfile: (data: { firstName: string; lastName: string; email: string }) =>
    request<any>("/users/profile", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<any>("/auth/change-password", { method: "PATCH", body: JSON.stringify(data) }),
};
