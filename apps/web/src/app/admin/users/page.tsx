"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Search, Plus, X, Eye, EyeOff } from "lucide-react";

const ROLES = ["", "CLIENT", "BARBER", "ADMIN"];
const ROLE_LABELS: Record<string, string> = { "": "Todos", CLIENT: "Clientes", BARBER: "Barberos", ADMIN: "Admins" };
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#c9a227", BARBERSHOP_OWNER: "#a78bfa", BARBER: "#60a5fa", CLIENT: "#ffffff40",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#4ade80", PENDING_VERIFICATION: "#f59e0b", SUSPENDED: "#f87171", INACTIVE: "#6b7280",
};

const EMPTY_BARBER = { firstName: "", lastName: "", email: "", phone: "", password: "" };

function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  // Modales
  const [showNewBarber, setShowNewBarber] = useState(false);
  const [newBarberForm, setNewBarberForm] = useState(EMPTY_BARBER);
  const [newBarberError, setNewBarberError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [assignUser, setAssignUser] = useState<any>(null);
  const [selectedBarbershop, setSelectedBarbershop] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, role],
    queryFn: () => adminApi.getUsers(page, search, role),
    retry: false,
  });

  const { data: barbershopsData } = useQuery({
    queryKey: ["barbershops-all"],
    queryFn: () => adminApi.getBarbershopsAll(),
    enabled: !!assignUser,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const createBarberMutation = useMutation({
    mutationFn: (data: typeof EMPTY_BARBER) => adminApi.createBarber(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowNewBarber(false);
      setNewBarberForm(EMPTY_BARBER);
      setNewBarberError("");
    },
    onError: (e: any) => setNewBarberError(e.message ?? "Error al crear el barbero"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, barbershopId }: { userId: string; barbershopId: string }) =>
      adminApi.assignBarber(userId, barbershopId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignUser(null);
        setSelectedBarbershop("");
        setAssignSuccess(false);
      }, 1500);
    },
  });

  const users: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;
  const barbershops: any[] = barbershopsData?.data ?? barbershopsData ?? [];

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-white/40 text-sm mt-1">{total.toLocaleString("es-CO")} usuarios registrados</p>
        </div>
        <button
          onClick={() => { setShowNewBarber(true); setNewBarberError(""); setNewBarberForm(EMPTY_BARBER); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all"
        >
          <Plus size={16} />
          Nuevo barbero
        </button>
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
        <div className="flex gap-2 flex-wrap">
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
                  <th className="px-4 py-3 text-left text-white/40 font-medium">Acciones</th>
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
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: ROLE_COLORS[u.role] ?? "#ffffff40", backgroundColor: `${ROLE_COLORS[u.role] ?? "#ffffff40"}20` }}
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">{fmt(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ color: STATUS_COLORS[u.status] ?? "#6b7280", backgroundColor: `${STATUS_COLORS[u.status] ?? "#6b7280"}15` }}
                      >
                        {u.status === "ACTIVE" ? "Activo" : u.status === "PENDING_VERIFICATION" ? "Pendiente" : u.status === "SUSPENDED" ? "Suspendido" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.role === "BARBER" && (
                          <button
                            onClick={() => { setAssignUser(u); setSelectedBarbershop(""); setAssignSuccess(false); }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold border border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa] hover:bg-[#60a5fa]/20 transition-all"
                          >
                            Asignar
                          </button>
                        )}
                        {u.role !== "ADMIN" && (
                          <select
                            defaultValue=""
                            onChange={(e) => { if (e.target.value) statusMutation.mutate({ id: u.id, status: e.target.value }); e.target.value = ""; }}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none"
                            style={{ backgroundColor: "#0a0a0f" }}
                          >
                            <option value="">Estado</option>
                            <option value="ACTIVE">Activar</option>
                            <option value="SUSPENDED">Suspender</option>
                            <option value="INACTIVE">Desactivar</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-white/30 text-sm">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Siguiente →</button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Nuevo barbero */}
      {showNewBarber && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#111118] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-lg font-bold">Nuevo barbero</h2>
              <button onClick={() => setShowNewBarber(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {newBarberError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{newBarberError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={newBarberForm.firstName}
                  onChange={(e) => setNewBarberForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Carlos"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1.5 block">Apellido *</label>
                <input
                  type="text"
                  value={newBarberForm.lastName}
                  onChange={(e) => setNewBarberForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="García"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Correo *</label>
              <input
                type="email"
                value={newBarberForm.email}
                onChange={(e) => setNewBarberForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="barbero@email.com"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40"
              />
            </div>

            <div className="mb-3">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Teléfono *</label>
              <input
                type="tel"
                value={newBarberForm.phone}
                onChange={(e) => setNewBarberForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+573001234567"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40"
              />
            </div>

            <div className="mb-5">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Contraseña temporal *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newBarberForm.password}
                  onChange={(e) => setNewBarberForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              disabled={createBarberMutation.isPending}
              onClick={() => { setNewBarberError(""); createBarberMutation.mutate(newBarberForm); }}
              className="w-full py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              {createBarberMutation.isPending ? "Creando..." : "Crear barbero"}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Asignar barbería */}
      {assignUser && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#111118] rounded-2xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-lg font-bold">Asignar barbería</h2>
              <button onClick={() => { setAssignUser(null); setSelectedBarbershop(""); }} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-white/40 text-sm mb-5">Para: {assignUser.firstName} {assignUser.lastName}</p>

            {assignSuccess ? (
              <div className="py-8 text-center">
                <p className="text-green-400 font-bold text-lg">Asignado correctamente</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto space-y-2 mb-5 pr-1">
                  {barbershops.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-6">No hay barberías</p>
                  ) : barbershops.map((b: any) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBarbershop(b.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedBarbershop === b.id
                          ? "border-[#c9a227]/50 bg-[#c9a227]/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{b.name}</p>
                        <p className="text-white/40 text-xs">{b.city}</p>
                      </div>
                      {selectedBarbershop === b.id && (
                        <div className="w-4 h-4 rounded-full bg-[#c9a227] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#0a0a0f]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  disabled={!selectedBarbershop || assignMutation.isPending}
                  onClick={() => assignMutation.mutate({ userId: assignUser.id, barbershopId: selectedBarbershop })}
                  className="w-full py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all disabled:opacity-40"
                >
                  {assignMutation.isPending ? "Asignando..." : "Asignar barbería"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
