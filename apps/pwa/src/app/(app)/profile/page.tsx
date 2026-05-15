"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsApi } from "@/lib/api/appointments.api";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { authApi } from "@/lib/api/auth.api";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getInitials, getStatusLabel } from "@/lib/utils";
import {
  Calendar,
  LogOut,
  ChevronRight,
  Crown,
  Scissors,
  Shield,
  HelpCircle,
  MapPin,
  QrCode,
  AlertCircle,
  FileText,
  Edit2,
  X,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Bell,
  Clock,
  Camera,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingAvatar(true);
    try {
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const avatarUrl = res.data?.avatarUrl ?? res.data?.data?.avatarUrl;
      if (avatarUrl) setUser({ ...user!, avatarUrl });
    } catch {
      // silently fail
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  // Edit profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
  const [profileSaved, setProfileSaved] = useState(false);

  // Change password
  const [showPassword, setShowPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments-stats"],
    queryFn: () => appointmentsApi.getMy({}),
  });
  const completedAppointmentsCount = (appointmentsData?.data || []).filter((a) => a.status === "COMPLETED").length;
  const upcomingAppointmentsCount = (appointmentsData?.data || []).filter((a) => ["PENDING", "CONFIRMED"].includes(a.status)).length;

  const { data: subscriptionData } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => subscriptionsApi.getMy().catch(() => null),
    enabled: user?.role === "BARBER",
    staleTime: 30_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (d: { firstName: string; lastName: string }) => api.patch("/users/me", d),
    onSuccess: (res) => {
      const updated = res.data?.data ?? res.data;
      if (updated) setUser({ ...user!, ...updated });
      else setUser({ ...user!, ...profileForm });
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) =>
      api.patch("/auth/change-password", d),
    onSuccess: () => {
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPassword(false);
      setPwSaved(true);
      setPwError("");
      setTimeout(() => setPwSaved(false), 2500);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "Error al cambiar la contraseña";
      setPwError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  function handlePasswordSubmit() {
    setPwError("");
    if (!pwForm.currentPassword) { setPwError("Ingresa tu contraseña actual"); return; }
    if (pwForm.newPassword.length < 8) { setPwError("Mínimo 8 caracteres"); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Las contraseñas no coinciden"); return; }
    changePasswordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  }

  const totalAppointments = appointmentsData?.total || 0;
  const completedAppointments = completedAppointmentsCount;
  const upcomingAppointments = upcomingAppointmentsCount;

  const subscription = subscriptionData;
  const hasActiveSubscription = subscription?.status === "ACTIVE";

  const handleLogout = async () => {
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch {}
    }
    clearAuth();
    router.replace("/auth/login");
  };

  const menuItems = [
    ...(user?.role === "BARBER"
      ? [
          { icon: <Crown size={18} className="text-primary" />, label: "Mi suscripción", href: "/subscription" },
          { icon: <Scissors size={18} className="text-primary" />, label: "Mis servicios", href: "/barber/services" },
          { icon: <Clock size={18} className="text-primary" />, label: "Mi horario", href: "/barber/schedule" },
        ]
      : []),
    ...(user?.role === "ADMIN"
      ? [{ icon: <Shield size={18} className="text-primary" />, label: "Panel admin", href: "/admin" }]
      : []),
    { icon: <Bell size={18} className="text-text-secondary" />, label: "Notificaciones", href: "/notifications" },
    { icon: <Calendar size={18} className="text-text-secondary" />, label: "Mis citas", href: "/appointments" },
    { icon: <MapPin size={18} className="text-text-secondary" />, label: "Explorar barberías", href: "/map" },
    { icon: <QrCode size={18} className="text-text-secondary" />, label: "Unirse a una fila", href: "/scan" },
    { icon: <HelpCircle size={18} className="text-text-secondary" />, label: "Soporte y Ayuda", href: "/support" },
    { icon: <FileText size={18} className="text-text-secondary" />, label: "Términos y Condiciones", href: "#" },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-6">Perfil</h1>

      {/* Success toasts */}
      {profileSaved && (
        <div className="mb-4 bg-[rgba(34,197,94,0.1)] border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check size={15} className="text-success" />
          <p className="text-success text-sm font-medium">Perfil actualizado</p>
        </div>
      )}
      {pwSaved && (
        <div className="mb-4 bg-[rgba(34,197,94,0.1)] border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check size={15} className="text-success" />
          <p className="text-success text-sm font-medium">Contraseña actualizada</p>
        </div>
      )}

      {/* Avatar & user info */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-[rgba(201,162,39,0.2)] border-2 border-primary/30 overflow-hidden flex items-center justify-center text-2xl font-bold text-primary">
            {user?.avatarUrl ? (
              <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              user ? getInitials(user.firstName, user.lastName) : "??"
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg disabled:opacity-60"
          >
            {uploadingAvatar ? <Loader2 size={13} className="text-black animate-spin" /> : <Camera size={13} className="text-black" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {!editingProfile ? (
          <>
            <h2 className="text-lg font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-text-secondary text-sm">{user?.email}</p>
            <Badge
              variant={user?.role === "ADMIN" ? "warning" : user?.role === "BARBER" ? "primary" : "secondary"}
              className="mt-2"
            >
              {user?.role === "ADMIN" ? "Administrador" : user?.role === "BARBER" ? "Barbero" : "Cliente"}
            </Badge>
            <button
              onClick={() => { setProfileForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" }); setEditingProfile(true); }}
              className="mt-3 flex items-center gap-1.5 text-text-tertiary text-xs hover:text-primary transition-colors"
            >
              <Edit2 size={12} /> Editar nombre
            </button>
          </>
        ) : (
          <div className="w-full max-w-xs mt-1">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-text-tertiary text-xs mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-text-tertiary text-xs mb-1 block">Apellido</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingProfile(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-text-secondary rounded-xl text-sm"
              >
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={() => updateProfileMutation.mutate(profileForm)}
                disabled={updateProfileMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-black font-bold rounded-xl text-sm disabled:opacity-50"
              >
                <Check size={14} /> {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-white">{totalAppointments}</p>
          <p className="text-text-tertiary text-xs mt-0.5">Citas</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-success">{completedAppointments}</p>
          <p className="text-text-tertiary text-xs mt-0.5">Completadas</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-warning">{upcomingAppointments}</p>
          <p className="text-text-tertiary text-xs mt-0.5">Próximas</p>
        </Card>
      </div>

      {/* Subscription banner */}
      {user?.role === "BARBER" && subscriptionData !== undefined && !hasActiveSubscription && (
        <button
          onClick={() => router.push("/subscription")}
          className="w-full mb-5 flex items-center gap-3 bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.25)] rounded-xl p-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">
              {subscription ? "Pago pendiente" : "Sin suscripción activa"}
            </p>
            <p className="text-xs text-primary/60 mt-0.5">Toca para activar tu plan</p>
          </div>
          <ChevronRight size={18} className="text-primary shrink-0" />
        </button>
      )}

      {/* Change password toggle */}
      <div className="mb-4">
        <button
          onClick={() => { setShowPassword((v) => !v); setPwError(""); }}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl hover:bg-[rgba(255,255,255,0.06)] transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-[rgba(96,165,250,0.1)] flex items-center justify-center shrink-0">
            <KeyRound size={16} className="text-blue-400" />
          </div>
          <span className="text-sm text-white flex-1 text-left">Cambiar contraseña</span>
          <ChevronRight size={16} className={cn("text-text-tertiary transition-transform", showPassword && "rotate-90")} />
        </button>

        {showPassword && (
          <div className="mt-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 space-y-3">
            {pwError && (
              <div className="p-2.5 bg-[rgba(239,68,68,0.1)] border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-xs">{pwError}</p>
              </div>
            )}
            <div>
              <label className="text-text-tertiary text-xs mb-1 block">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-9 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-text-tertiary text-xs mb-1 block">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={pwForm.newPassword}
                  placeholder="Mínimo 8 caracteres"
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-9 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary/40"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-text-tertiary text-xs mb-1 block">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <Button fullWidth onClick={handlePasswordSubmit} loading={changePasswordMutation.isPending}>
              Actualizar contraseña
            </Button>
          </div>
        )}
      </div>

      {/* Menu items */}
      <Card padding="none" className="mb-6 overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.href !== "#" && router.push(item.href)}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-[rgba(255,255,255,0.03)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[rgba(201,162,39,0.08)] flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <span className="text-sm text-white flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        ))}
      </Card>

      {/* Logout */}
      <Button variant="danger" fullWidth onClick={handleLogout} className="gap-2">
        <LogOut size={18} />
        Cerrar sesión
      </Button>

      <p className="text-center text-text-tertiary text-xs mt-6">BarberProSuite v1.0.0</p>
    </div>
  );
}
