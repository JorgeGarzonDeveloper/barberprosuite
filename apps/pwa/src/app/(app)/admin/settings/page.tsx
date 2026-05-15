"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ChevronLeft, Check, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

const TABS = [
  { key: "profile", label: "Perfil" },
  { key: "security", label: "Seguridad" },
  { key: "notifications", label: "Notificaciones" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const NOTIF_ITEMS = [
  { key: "newBarbershops", label: "Nuevos registros de barberías", desc: "Cuando una nueva barbería se registra" },
  { key: "payments", label: "Pagos de suscripciones", desc: "Confirmaciones de pagos recibidos" },
  { key: "weeklyReports", label: "Reportes semanales", desc: "Resumen de actividad cada semana" },
  { key: "systemAlerts", label: "Alertas del sistema", desc: "Errores críticos y mantenimiento" },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
  });

  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    newBarbershops: true, payments: true, weeklyReports: false, systemAlerts: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem("bps-admin-notif-prefs");
    if (stored) { try { setNotifPrefs(JSON.parse(stored)); } catch {} }
  }, []);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const updateProfile = useMutation({
    mutationFn: (d: typeof profile) => api.patch("/users/me", d),
    onSuccess: (res) => {
      const updated = res.data?.data ?? res.data;
      setUser({ ...user!, ...(updated || profile) });
      flashSaved();
    },
  });

  const changePassword = useMutation({
    mutationFn: (d: { currentPassword: string; newPassword: string }) => api.patch("/auth/change-password", d),
    onSuccess: () => {
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      flashSaved();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? "Error al cambiar la contraseña";
      setPwError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  function handlePasswordSubmit() {
    setPwError("");
    if (security.newPassword !== security.confirmPassword) { setPwError("Las contraseñas no coinciden"); return; }
    if (security.newPassword.length < 8) { setPwError("Mínimo 8 caracteres"); return; }
    changePassword.mutate({ currentPassword: security.currentPassword, newPassword: security.newPassword });
  }

  function saveNotifPrefs() {
    localStorage.setItem("bps-admin-notif-prefs", JSON.stringify(notifPrefs));
    flashSaved();
  }

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Configuración</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap shrink-0",
              tab === t.key
                ? "bg-[rgba(201,162,39,0.12)] border-primary text-primary"
                : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-text-secondary hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="mb-4 bg-[rgba(34,197,94,0.1)] border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <Check size={15} className="text-success" />
          <p className="text-success text-sm font-medium">Guardado correctamente</p>
        </div>
      )}

      {/* PERFIL */}
      {tab === "profile" && (
        <Card>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Nombre</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Apellido</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Correo</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="mb-4">
            <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Rol</label>
            <div className="px-3 py-2.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl text-text-tertiary text-sm">
              Administrador
            </div>
          </div>
          <Button fullWidth onClick={() => updateProfile.mutate(profile)} loading={updateProfile.isPending}>
            Guardar cambios
          </Button>
        </Card>
      )}

      {/* SEGURIDAD */}
      {tab === "security" && (
        <Card>
          {pwError && (
            <div className="mb-4 p-3 bg-[rgba(239,68,68,0.1)] border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{pwError}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={security.currentPassword}
                  onChange={(e) => setSecurity((s) => ({ ...s, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={security.newPassword}
                  placeholder="Mínimo 8 caracteres"
                  onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary/40"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-text-tertiary text-xs font-semibold mb-1.5 block">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white text-sm focus:outline-none focus:border-primary/40"
              />
            </div>
            <Button fullWidth onClick={handlePasswordSubmit} loading={changePassword.isPending}>
              Actualizar contraseña
            </Button>
          </div>
        </Card>
      )}

      {/* NOTIFICACIONES */}
      {tab === "notifications" && (
        <div className="space-y-4">
          {/* Test notification */}
          <Card>
            <h3 className="text-white text-sm font-bold mb-1">Prueba de notificaciones push</h3>
            <p className="text-text-tertiary text-xs mb-3">
              Envía una notificación de prueba a todos los admins para verificar que el sistema funciona correctamente.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                api.post("/admin/notifications/send", {
                  title: "🔔 Prueba del sistema",
                  body: "Las notificaciones push están funcionando correctamente.",
                  roles: ["ADMIN"],
                }).then((r) => {
                  const d = r.data?.data ?? r.data;
                  if (d?.sent === false) {
                    alert(`Error: ${d?.reason ?? "VAPID keys no configuradas"}`);
                  } else {
                    alert("✅ Notificación de prueba enviada");
                  }
                }).catch(() => alert("Error al enviar. Verifica la configuración del servidor."))
              }
            >
              Enviar notificación de prueba
            </Button>
          </Card>

          <Card>
            <h3 className="text-white text-sm font-bold mb-1">Preferencias de alertas</h3>
            <p className="text-text-tertiary text-xs mb-4">
              Configura qué tipos de eventos del sistema te notifican
            </p>
            <div className="space-y-4 mb-5">
              {NOTIF_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-text-tertiary text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-all flex-shrink-0 mt-0.5",
                      notifPrefs[item.key as keyof typeof notifPrefs] ? "bg-primary" : "bg-[rgba(255,255,255,0.15)]"
                    )}
                  >
                    <span className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      notifPrefs[item.key as keyof typeof notifPrefs] ? "left-6" : "left-1"
                    )} />
                  </button>
                </div>
              ))}
            </div>
            <Button fullWidth onClick={saveNotifPrefs}>
              Guardar preferencias
            </Button>
          </Card>

          <div className="bg-[rgba(201,162,39,0.06)] border border-primary/20 rounded-xl p-4">
            <p className="text-primary text-xs font-semibold mb-1">Para enviar notificaciones masivas</p>
            <p className="text-text-secondary text-xs">
              Ve a <a href="/admin/notifications" className="text-primary underline">Admin → Notificaciones</a> para enviar mensajes a todos los usuarios.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
