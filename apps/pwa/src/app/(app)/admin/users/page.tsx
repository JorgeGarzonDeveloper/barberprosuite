"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, UserAdmin } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import { getInitials, cn } from "@/lib/utils";
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Store,
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  BARBER: "Barbero",
  CLIENT: "Cliente",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-warning bg-warning/10",
  BARBER: "text-blue-400 bg-blue-400/10",
  CLIENT: "text-text-secondary bg-white/5",
};

const EMPTY_BARBER = { firstName: "", lastName: "", email: "", phone: "", password: "" };

interface BarbershopSimple {
  id: string;
  name: string;
  city: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modals
  const [newBarberOpen, setNewBarberOpen] = useState(false);
  const [newBarberForm, setNewBarberForm] = useState(EMPTY_BARBER);
  const [newBarberError, setNewBarberError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUser, setAssignUser] = useState<UserAdmin | null>(null);
  const [assignSelected, setAssignSelected] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);

  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: () =>
      adminApi.getUsers({
        page,
        limit: LIMIT,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
  });

  const { data: shopData } = useQuery({
    queryKey: ["barbershops-all-simple"],
    queryFn: async () => {
      const res = await api.get("/barbershops", { params: { limit: 100 } });
      return (res.data?.data?.data ?? res.data?.data ?? []) as BarbershopSimple[];
    },
    enabled: assignOpen,
  });

  const createBarberMutation = useMutation({
    mutationFn: () => adminApi.createBarber(newBarberForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setNewBarberOpen(false);
      setNewBarberForm(EMPTY_BARBER);
      setNewBarberError("");
    },
    onError: (e: any) => {
      setNewBarberError(
        e?.response?.data?.error?.[0] ??
          e?.response?.data?.message ??
          "Error al crear el barbero"
      );
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => adminApi.assignBarber(assignUser!.id, assignSelected),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignOpen(false);
        setAssignSuccess(false);
        setAssignSelected("");
        setAssignUser(null);
      }, 1500);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (user: UserAdmin) => adminApi.toggleUserStatus(user.id, user.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const openAssign = (u: UserAdmin) => {
    setAssignUser(u);
    setAssignSelected("");
    setAssignSuccess(false);
    setAssignOpen(true);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white flex-1">Usuarios</h1>
        <Button size="sm" onClick={() => { setNewBarberError(""); setNewBarberOpen(true); }} className="gap-1.5">
          <Plus size={15} />
          Nuevo barbero
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
        />
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { label: "Todos", value: "" },
          { label: "Barberos", value: "BARBER" },
          { label: "Clientes", value: "CLIENT" },
          { label: "Admin", value: "ADMIN" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setRoleFilter(f.value); setPage(1); }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
              roleFilter === f.value
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-white/5 border-white/10 text-text-secondary hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-text-tertiary text-xs mb-3">{total} usuarios</p>

      {isLoading ? (
        <PageSpinner />
      ) : users.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <Card key={u.id} padding="sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {getInitials(u.firstName, u.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{u.email}</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ROLE_COLORS[u.role] ?? "text-text-secondary bg-white/5")}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </div>

                {/* Status + date */}
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    u.status === "ACTIVE"
                      ? "text-success bg-success/10 border-success/20"
                      : u.status === "PENDING_VERIFICATION"
                      ? "text-warning bg-warning/10 border-warning/20"
                      : "text-error bg-error/10 border-error/20"
                  )}>
                    {u.status === "ACTIVE" ? "Activo" : u.status === "PENDING_VERIFICATION" ? "Pendiente" : "Suspendido"}
                  </span>
                  <span className="text-text-tertiary text-xs">
                    {new Date(u.createdAt).toLocaleDateString("es-CO")}
                  </span>
                </div>

                {/* Actions — solo para no-admin */}
                {u.role !== "ADMIN" && (
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    {u.role === "BARBER" && (
                      <button
                        onClick={() => openAssign(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-400 text-xs font-semibold hover:bg-blue-400/15 transition-colors"
                      >
                        <Store size={12} />
                        Asignar
                      </button>
                    )}
                    <button
                      onClick={() => toggleStatusMutation.mutate(u)}
                      disabled={toggleStatusMutation.isPending}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors",
                        u.status === "ACTIVE"
                          ? "bg-error/10 border-error/20 text-error hover:bg-error/15"
                          : "bg-success/10 border-success/20 text-success hover:bg-success/15"
                      )}
                    >
                      {u.status === "ACTIVE" ? (
                        <><Ban size={12} /> Suspender</>
                      ) : (
                        <><CheckCircle size={12} /> Activar</>
                      )}
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-text-secondary text-sm">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <Users size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No se encontraron usuarios</p>
        </div>
      )}

      {/* ── Modal: Nuevo barbero ─────────────────────────────────────────── */}
      <Modal isOpen={newBarberOpen} onClose={() => setNewBarberOpen(false)} title="Nuevo barbero">
        <div className="flex flex-col gap-3">
          {newBarberError && (
            <div className="flex items-start gap-2 bg-error/10 border border-error/20 rounded-xl p-3">
              <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
              <p className="text-error text-xs">{newBarberError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "firstName", label: "Nombre *", placeholder: "Juan" },
              { key: "lastName", label: "Apellido *", placeholder: "García" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">{f.label}</label>
                <input
                  value={newBarberForm[f.key as keyof typeof newBarberForm]}
                  onChange={(e) => setNewBarberForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Correo *</label>
            <input
              type="email"
              value={newBarberForm.email}
              onChange={(e) => setNewBarberForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="barbero@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Teléfono *</label>
            <input
              type="tel"
              value={newBarberForm.phone}
              onChange={(e) => setNewBarberForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+573001234567"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Contraseña temporal *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newBarberForm.password}
                onChange={(e) => setNewBarberForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 pr-10 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button
            fullWidth
            loading={createBarberMutation.isPending}
            onClick={() => { setNewBarberError(""); createBarberMutation.mutate(); }}
          >
            Crear barbero
          </Button>
        </div>
      </Modal>

      {/* ── Modal: Asignar a barbería ───────────────────────────────────── */}
      <Modal
        isOpen={assignOpen}
        onClose={() => { setAssignOpen(false); setAssignSelected(""); setAssignUser(null); setAssignSuccess(false); }}
        title="Asignar barbería"
      >
        {assignSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle size={40} className="text-success" />
            <p className="text-success font-semibold">Asignado correctamente</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-text-secondary text-sm">
              Para: <span className="text-white font-medium">{assignUser?.firstName} {assignUser?.lastName}</span>
            </p>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {(shopData ?? []).length === 0 ? (
                <p className="text-text-tertiary text-sm text-center py-4">No hay barberías</p>
              ) : (
                (shopData ?? []).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setAssignSelected(b.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                      assignSelected === b.id
                        ? "bg-primary/10 border-primary/40"
                        : "bg-white/3 border-white/8 hover:border-white/15"
                    )}
                  >
                    <Store size={16} className="text-text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{b.name}</p>
                      <p className="text-xs text-text-secondary">{b.city}</p>
                    </div>
                    {assignSelected === b.id && <CheckCircle size={16} className="text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <Button
              fullWidth
              disabled={!assignSelected}
              loading={assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              Asignar barbería
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
