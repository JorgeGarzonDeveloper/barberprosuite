"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsApi } from "@/lib/api/appointments.api";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { authApi } from "@/lib/api/auth.api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments-stats"],
    queryFn: () => appointmentsApi.getMy({ page: 1, limit: 100 }),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => subscriptionsApi.getMy().catch(() => null),
    enabled: user?.role === "BARBER",
    staleTime: 30_000,
  });

  const appointments = appointmentsData?.data || [];
  const totalAppointments = appointmentsData?.total || 0;
  const completedAppointments = appointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;
  const upcomingAppointments = appointments.filter((a) =>
    ["PENDING", "CONFIRMED"].includes(a.status)
  ).length;

  const subscription = subscriptionData?.data;
  const hasActiveSubscription = subscription?.status === "ACTIVE";

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    clearAuth();
    router.replace("/auth/login");
  };

  const menuItems = [
    ...(user?.role === "BARBER"
      ? [
          {
            icon: <Crown size={18} className="text-primary" />,
            label: "Mi suscripción",
            href: "/subscription",
          },
          {
            icon: <Scissors size={18} className="text-primary" />,
            label: "Mis servicios",
            href: "/barber/services",
          },
        ]
      : []),
    ...(user?.role === "ADMIN"
      ? [
          {
            icon: <Shield size={18} className="text-primary" />,
            label: "Panel admin",
            href: "/admin",
          },
        ]
      : []),
    {
      icon: <Calendar size={18} className="text-text-secondary" />,
      label: "Mis citas",
      href: "/appointments",
    },
    {
      icon: <MapPin size={18} className="text-text-secondary" />,
      label: "Explorar barberías",
      href: "/map",
    },
    {
      icon: <QrCode size={18} className="text-text-secondary" />,
      label: "Unirse a una fila",
      href: "/scan",
    },
    {
      icon: <HelpCircle size={18} className="text-text-secondary" />,
      label: "Soporte y Ayuda",
      href: "/support",
    },
    {
      icon: <FileText size={18} className="text-text-secondary" />,
      label: "Términos y Condiciones",
      href: "#",
    },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-6">Perfil</h1>

      {/* Avatar & user info */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-[rgba(201,162,39,0.2)] border-2 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary mb-3">
          {user ? getInitials(user.firstName, user.lastName) : "??"}
        </div>
        <h2 className="text-lg font-bold text-white">
          {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-text-secondary text-sm">{user?.email}</p>
        <Badge
          variant={user?.role === "ADMIN" ? "warning" : user?.role === "BARBER" ? "primary" : "secondary"}
          className="mt-2"
        >
          {user?.role === "ADMIN"
            ? "Administrador"
            : user?.role === "BARBER"
            ? "Barbero"
            : "Cliente"}
        </Badge>
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

      {/* Subscription banner — visible solo si barbero sin suscripción activa */}
      {user?.role === "BARBER" && subscriptionData !== undefined && !hasActiveSubscription && (
        <button
          onClick={() => router.push("/subscription")}
          className="w-full mb-6 flex items-center gap-3 bg-[rgba(201,162,39,0.08)] border border-[rgba(201,162,39,0.25)] rounded-xl p-4 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-[rgba(201,162,39,0.15)] flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">
              {subscription ? "Pago pendiente" : "Sin suscripción activa"}
            </p>
            <p className="text-xs text-primary/60 mt-0.5">
              Toca para activar tu plan y empezar a trabajar
            </p>
          </div>
          <ChevronRight size={18} className="text-primary shrink-0" />
        </button>
      )}

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
            <span className="text-sm text-white flex-1 text-left">
              {item.label}
            </span>
            <ChevronRight size={16} className="text-text-tertiary" />
          </button>
        ))}
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        fullWidth
        onClick={handleLogout}
        className="gap-2"
      >
        <LogOut size={18} />
        Cerrar sesión
      </Button>

      <p className="text-center text-text-tertiary text-xs mt-6">
        BarberProSuite v1.0.0
      </p>
    </div>
  );
}
