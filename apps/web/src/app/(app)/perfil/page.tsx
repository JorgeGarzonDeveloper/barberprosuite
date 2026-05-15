"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import {
  Camera, LogOut, ChevronRight, Calendar, Clock, Shield, HelpCircle,
  Scissors, BarChart3, CreditCard, AlertCircle, Edit2, Eye, EyeOff,
  Check, X, KeyRound,
} from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout, setAvatarUrl, setUser } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Edit profile
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" });
  const [profileSaved, setProfileSaved] = useState(false);

  // Change password
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["profile-stats"],
    queryFn: () => api.get("/appointments/my/stats").then((r) => r.data.data).catch(() => null),
    retry: false,
  });

  const { data: subscription } = useQuery({
    queryKey: ["my-subscription-perfil"],
    queryFn: () => api.get("/subscriptions/my").then((r) => r.data.data).catch(() => null),
    enabled: user?.role === "BARBER",
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (d: { firstName: string; lastName: string }) => api.patch("/users/me", d),
    onSuccess: (res) => {
      const updated = res.data.data ?? res.data;
      if (updated && setUser) setUser({ ...user!, ...updated });
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => api.patch("/auth/change-password", d),
    onSuccess: () => {
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordSection(false);
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    },
    onError: (e: any) => {
      setPwError(e?.response?.data?.message ?? "Error al cambiar la contraseña");
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/users/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setAvatarUrl(res.data.data?.avatarUrl ?? res.data.avatarUrl);
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch { } finally { setUploading(false); }
  };

  function handlePasswordSubmit() {
    setPwError("");
    if (!pwForm.currentPassword) { setPwError("Ingresa tu contraseña actual"); return; }
    if (pwForm.newPassword.length < 8) { setPwError("La nueva contraseña debe tener mínimo 8 caracteres"); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("Las contraseñas no coinciden"); return; }
    changePasswordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  }

  const handleLogout = () => { logout(); router.replace("/login"); };

  const isBarberWithoutSub = user?.role === "BARBER" && subscription !== undefined && (!subscription || subscription.status !== "ACTIVE");

  const menuItems = [
    { label: "Mis citas", href: "/citas", icon: Calendar, color: "#a78bfa" },
    ...(user?.role === "BARBER" ? [
      { label: "Cola de espera", href: "/barber/cola", icon: Scissors, color: "#c9a227" },
      { label: "Mis servicios", href: "/barber/servicios", icon: Scissors, color: "#34d399" },
      { label: "Mi horario", href: "/barber/horario", icon: Clock, color: "#60a5fa" },
    ] : []),
    ...(user?.role === "ADMIN" ? [
      { label: "Panel de administración", href: "/admin", icon: BarChart3, color: "#fb923c" },
    ] : []),
    { label: "Soporte y ayuda", href: "/soporte", icon: HelpCircle, color: "#38bdf8" },
    { label: "Términos y condiciones", href: "/terminos", icon: Shield, color: "#6b7280" },
    { label: "Política de privacidad", href: "/privacidad", icon: Shield, color: "#6b7280" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto lg:pt-10">
      {/* Subscription banner for barbers */}
      {isBarberWithoutSub && (
        <Link href="/suscripcion"
          className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 mb-5 hover:bg-amber-500/15 transition-all">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 font-bold text-sm">
              {subscription?.status === "PENDING_PAYMENT" ? "Pago pendiente" : "Sin suscripción activa"}
            </p>
            <p className="text-amber-400/60 text-xs">Activa tu plan para recibir clientes</p>
          </div>
          <ChevronRight size={14} className="text-amber-400/50" />
        </Link>
      )}

      {/* Success messages */}
      {profileSaved && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
          <Check size={15} className="text-green-400" />
          <p className="text-green-400 text-sm font-semibold">Perfil actualizado</p>
        </div>
      )}
      {pwSaved && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
          <Check size={15} className="text-green-400" />
          <p className="text-green-400 text-sm font-semibold">Contraseña actualizada</p>
        </div>
      )}

      {/* Avatar + info */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-[#c9a227]/20 border-2 border-[#c9a227]/30 overflow-hidden flex items-center justify-center">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#c9a227] text-3xl font-bold">{user?.firstName?.[0]?.toUpperCase()}</span>}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#c9a227] rounded-full flex items-center justify-center border-2 border-[#0a0a0f] hover:bg-[#e8cc6a] transition-colors disabled:opacity-50">
            <Camera size={14} className="text-black" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        {!editingProfile ? (
          <>
            <h2 className="text-white text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-white/40 text-sm">{user?.email}</p>
            <span className="mt-2 px-3 py-1 bg-[#c9a227]/15 text-[#c9a227] text-xs font-bold rounded-full border border-[#c9a227]/30">
              {user?.role === "BARBER" ? "Barbero" : user?.role === "ADMIN" ? "Administrador" : "Cliente"}
            </span>
            <button onClick={() => { setProfileForm({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "" }); setEditingProfile(true); }}
              className="mt-3 flex items-center gap-1.5 text-white/30 text-xs hover:text-[#c9a227] transition-colors">
              <Edit2 size={12} /> Editar perfil
            </button>
          </>
        ) : (
          <div className="w-full max-w-xs mt-1">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Nombre</label>
                <input type="text" value={profileForm.firstName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Apellido</label>
                <input type="text" value={profileForm.lastName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingProfile(false)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 border border-white/10 text-white/50 rounded-xl text-sm">
                <X size={14} /> Cancelar
              </button>
              <button onClick={() => updateProfileMutation.mutate(profileForm)} disabled={updateProfileMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#c9a227] text-black font-bold rounded-xl text-sm disabled:opacity-50">
                <Check size={14} /> {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total citas", value: stats.total ?? 0 },
            { label: "Completadas", value: stats.completed ?? 0 },
            { label: "Próximas", value: stats.upcoming ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white text-xl font-bold">{s.value}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Subscription link for barbers with active sub */}
      {user?.role === "BARBER" && subscription?.status === "ACTIVE" && (
        <Link href="/suscripcion"
          className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 mb-3 hover:bg-white/8 hover:border-[#c9a227]/30 transition-all">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#c9a22720" }}>
            <CreditCard size={16} style={{ color: "#c9a227" }} />
          </div>
          <span className="text-white text-sm font-medium flex-1">Mi suscripción</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 mr-1">ACTIVA</span>
          <ChevronRight size={14} className="text-white/20" />
        </Link>
      )}

      {/* Change password toggle */}
      <div className="mb-3">
        <button onClick={() => { setShowPasswordSection((v) => !v); setPwError(""); }}
          className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 hover:bg-white/8 transition-all">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#60a5fa]/15">
            <KeyRound size={16} className="text-[#60a5fa]" />
          </div>
          <span className="text-white text-sm font-medium flex-1 text-left">Cambiar contraseña</span>
          <ChevronRight size={14} className={`text-white/20 transition-transform ${showPasswordSection ? "rotate-90" : ""}`} />
        </button>

        {showPasswordSection && (
          <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            {pwError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-xs">{pwError}</p>
              </div>
            )}
            <div>
              <label className="text-white/40 text-xs mb-1 block">Contraseña actual</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-9 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Nueva contraseña</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={pwForm.newPassword}
                  placeholder="Mínimo 8 caracteres"
                  onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-9 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40" />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Confirmar nueva contraseña</label>
              <input type="password" value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
            </div>
            <button onClick={handlePasswordSubmit} disabled={changePasswordMutation.isPending}
              className="w-full py-2.5 bg-[#c9a227] text-black font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
              {changePasswordMutation.isPending ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${i < menuItems.length - 1 ? "border-b border-white/5" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <span className="text-white text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight size={14} className="text-white/20" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-all">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}
