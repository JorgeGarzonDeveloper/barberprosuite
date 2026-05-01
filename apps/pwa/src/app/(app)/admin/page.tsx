"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import { useAuthStore } from "@/store/auth.store";
import Card from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, cn } from "@/lib/utils";
import {
  Users,
  Store,
  Calendar,
  DollarSign,
  Crown,
  Activity,
  TrendingUp,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const adminSections = [
  { label: "Usuarios", href: "/admin/users", icon: <Users size={18} /> },
  { label: "Barberías", href: "/admin/barbershops", icon: <Store size={18} /> },
  { label: "Citas", href: "/admin/appointments", icon: <Calendar size={18} /> },
  { label: "Colas", href: "/admin/queue", icon: <Activity size={18} /> },
  { label: "Analytics", href: "/admin/analytics", icon: <TrendingUp size={18} /> },
  { label: "Suscripciones", href: "/admin/subscriptions", icon: <Crown size={18} /> },
  { label: "Notificaciones", href: "/admin/notifications", icon: <Users size={18} /> },
  { label: "Configuración", href: "/admin/settings", icon: <UserCheck size={18} /> },
];

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "ADMIN") router.replace("/home");
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });

  if (isLoading) return <PageSpinner />;

  const stats = [
    {
      label: "Usuarios",
      value: data?.totalUsers || 0,
      icon: <Users size={20} className="text-primary" />,
      color: "text-primary",
    },
    {
      label: "Barberías",
      value: data?.totalBarbershops || 0,
      icon: <Store size={20} className="text-warning" />,
      color: "text-warning",
    },
    {
      label: "Citas totales",
      value: data?.totalAppointments || 0,
      icon: <Calendar size={20} className="text-success" />,
      color: "text-success",
    },
    {
      label: "Ingresos",
      value: formatCOP(data?.totalRevenue || 0),
      icon: <DollarSign size={20} className="text-primary" />,
      color: "text-primary",
      isText: true,
    },
    {
      label: "Suscripciones",
      value: data?.activeSubscriptions || 0,
      icon: <Crown size={20} className="text-warning" />,
      color: "text-warning",
    },
    {
      label: "Colas activas",
      value: data?.activeQueues || 0,
      icon: <Activity size={20} className="text-success" />,
      color: "text-success",
    },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-6">Panel Admin</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {stat.icon}
              <span className="text-text-tertiary text-xs">{stat.label}</span>
            </div>
            <p className={cn("text-xl font-bold", stat.color)}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Navigation sections */}
      <div>
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
          Secciones
        </h2>
        <Card padding="none" className="overflow-hidden">
          {adminSections.map((section, i) => (
            <button
              key={i}
              onClick={() => router.push(section.href)}
              className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-[rgba(255,255,255,0.03)] transition-colors border-b border-[rgba(255,255,255,0.04)] last:border-0"
            >
              <span className="text-primary">{section.icon}</span>
              <span className="text-sm text-white flex-1 text-left">
                {section.label}
              </span>
              <ChevronRight size={16} className="text-text-tertiary" />
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
