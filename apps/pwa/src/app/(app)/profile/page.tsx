"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { appointmentsApi } from "@/lib/api/appointments.api";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { authApi } from "@/lib/api/auth.api";
import Card from "@/components/ui/Card";
import Badge, { getStatusVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getInitials, getStatusLabel } from "@/lib/utils";
import {
  Calendar,
  LogOut,
  ChevronRight,
  Crown,
  Scissors,
  Bell,
  Shield,
  HelpCircle,
  Settings,
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
    queryKey: ["subscription"],
    queryFn: () => subscriptionsApi.getMy(),
    enabled: user?.role === "BARBER",
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
            icon: <Scissors size={18} className="text-primary" />,
            label: "Mis servicios",
            href: "/barber/services",
          },
          {
            icon: <Crown size={18} className="text-primary" />,
            label: "Suscripción",
            href: "/subscription",
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
      icon: <Bell size={18} className="text-text-secondary" />,
      label: "Notificaciones",
      href: "#",
    },
    {
      icon: <HelpCircle size={18} className="text-text-secondary" />,
      label: "Soporte",
      href: "/support",
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
          <p className="text-xl font-bold text-primary">{totalAppointments}</p>
          <p className="text-text-tertiary text-xs mt-0.5">Total</p>
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

      {/* Subscription banner for barbers */}
      {user?.role === "BARBER" && subscription && (
        <Card className="mb-6 border-primary/20 bg-[rgba(201,162,39,0.04)]">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {subscription.plan?.displayName || "Plan activo"}
              </p>
              <p className="text-text-secondary text-xs">
                Estado:{" "}
                <span className={`font-medium ${subscription.status === "ACTIVE" ? "text-success" : "text-warning"}`}>
                  {getStatusLabel(subscription.status)}
                </span>
              </p>
            </div>
            <button
              onClick={() => router.push("/subscription")}
              className="text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </Card>
      )}

      {/* Menu items */}
      <Card padding="none" className="mb-6 overflow-hidden">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.href !== "#" && router.push(item.href)}
            className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-[rgba(255,255,255,0.03)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
          >
            {item.icon}
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
    </div>
  );
}
