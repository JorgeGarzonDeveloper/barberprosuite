"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin-api";
import { Eye, EyeOff, Check } from "lucide-react";

const TABS = [
  { key: "profile", label: "Perfil" },
  { key: "security", label: "Seguridad" },
  { key: "notifications", label: "Notificaciones" },
];

const NOTIF_ITEMS = [
  { key: "newBarbershops", label: "Nuevos registros de barberías", desc: "Cuando una nueva barbería se registra" },
  { key: "payments", label: "Pagos de suscripciones", desc: "Confirmaciones de pagos recibidos" },
  { key: "weeklyReports", label: "Reportes semanales", desc: "Resumen de actividad cada semana" },
  { key: "systemAlerts", label: "Alertas del sistema", desc: "Errores críticos y mantenimiento" },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"profile" | "security" | "notifications">("profile");
  const [saved, setSaved] = useState(false);

  const [adminUser] = useState<any>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("admin_user") ?? "{}"); } catch { return {}; }
  });

  const [profile, setProfile] = useState({
    firstName: adminUser?.firstName ?? "",
    lastName: adminUser?.lastName ?? "",
    email: adminUser?.email ?? "",
  });

  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    newBarbershops: true, payments: true, weeklyReports: false, systemAlerts: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bps-admin-notif-prefs");
      if (saved) { try { setNotifPrefs(JSON.parse(saved)); } catch {} }
    }
  }, []);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const updateProfile = useMutation({
    mutationFn: (d: typeof profile) => adminApi.updateProfile(d),
    onSuccess: () => {
      const updated = { ...adminUser, ...profile };
      localStorage.setItem("admin_user", JSON.stringify(updated));
      flashSaved();
    },
  });

  const changePassword = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => adminApi.changePassword(d),
    onSuccess: () => {
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flashSaved();
    },
    onError: (e: any) => setPasswordError(e.message ?? "Error al cambiar la contraseña"),
  });

  function handlePasswordSubmit() {
    setPasswordError("");
    if (security.newPassword !== security.confirmPassword) { setPasswordError("Las contraseñas no coinciden"); return; }
    if (security.newPassword.length < 8) { setPasswordError("Mínimo 8 caracteres"); return; }
    changePassword.mutate({ currentPassword: security.currentPassword, newPassword: security.newPassword });
  }

  function saveNotifPrefs() {
    localStorage.setItem("bps-admin-notif-prefs", JSON.stringify(notifPrefs));
    flashSaved();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/40 text-sm mt-1">Perfil, seguridad y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              tab === t.key ? "bg-[#c9a227]/15 border-[#c9a227] text-[#c9a227]" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl max-w-lg">
          <Check size={16} className="text-green-400" />
          <p className="text-green-400 text-sm font-semibold">Guardado correctamente</p>
        </div>
      )}

      <div className="max-w-lg">
        {/* PERFIL */}
        {tab === "profile" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1.5 block">Nombre</label>
                <input type="text" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
              </div>
              <div>
                <label className="text-white/50 text-xs font-semibold mb-1.5 block">Apellido</label>
                <input type="text" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Correo</label>
              <input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
            </div>
            <div className="pt-1">
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Rol</label>
              <div className="px-3 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white/40 text-sm">Administrador</div>
            </div>
            <button onClick={() => updateProfile.mutate(profile)} disabled={updateProfile.isPending}
              className="w-full py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
              {updateProfile.isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* SEGURIDAD */}
        {tab === "security" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{passwordError}</p>
              </div>
            )}
            <div>
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Contraseña actual</label>
              <div className="relative">
                <input type={showCurrent ? "text" : "password"} value={security.currentPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Nueva contraseña</label>
              <div className="relative">
                <input type={showNew ? "text" : "password"} value={security.newPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/40" />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold mb-1.5 block">Confirmar nueva contraseña</label>
              <input type="password" value={security.confirmPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a227]/40" />
            </div>
            <button onClick={handlePasswordSubmit} disabled={changePassword.isPending}
              className="w-full py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm disabled:opacity-50 transition-all">
              {changePassword.isPending ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        )}

        {/* NOTIFICACIONES */}
        {tab === "notifications" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="space-y-4 mb-6">
              {NOTIF_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${notifPrefs[item.key as keyof typeof notifPrefs] ? "bg-[#c9a227]" : "bg-white/20"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifPrefs[item.key as keyof typeof notifPrefs] ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={saveNotifPrefs}
              className="w-full py-3 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-xl text-sm transition-all">
              Guardar preferencias
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
