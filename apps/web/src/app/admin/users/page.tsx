"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Search } from "lucide-react";

const ROLES = ["", "CLIENT", "BARBER", "ADMIN"];
const ROLE_LABELS: Record<string, string> = { "": "Todos", CLIENT: "Clientes", BARBER: "Barberos", ADMIN: "Admins" };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#4ade80", PENDING_VERIFICATION: "#f59e0b", SUSPENDED: "#f87171", INACTIVE: "#6b7280",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, role],
    queryFn: () => adminApi.getUsers(page, search, role),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Usuarios</h1>
        <p className="text-white/40 text-sm mt-1">{total.toLocaleString("es-CO")} usuarios registrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/30"
          />
        </div>
        <div className="flex gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1); }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                role === r ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-white/30">Sin usuarios</p>
        </div>
      ) : (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium hidden md:table-cell">Rol</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium hidden lg:table-cell">Registro</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-white/40 text-xs">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60">{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">{fmt(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: STATUS_COLORS[u.status] ?? "#6b7280", backgroundColor: `${STATUS_COLORS[u.status] ?? "#6b7280"}15` }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) mutation.mutate({ id: u.id, status: e.target.value }); e.target.value = ""; }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none"
                        style={{ backgroundColor: "#0a0a0f" }}
                      >
                        <option value="">Cambiar estado</option>
                        <option value="ACTIVE">Activar</option>
                        <option value="SUSPENDED">Suspender</option>
                        <option value="INACTIVE">Desactivar</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-sm">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
