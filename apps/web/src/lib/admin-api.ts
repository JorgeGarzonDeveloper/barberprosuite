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

  getBarbershops: (page = 1) => request<any>(`/admin/barbershops?page=${page}&limit=20`),
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
};
