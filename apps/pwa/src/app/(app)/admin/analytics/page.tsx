"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChevronLeft, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#22c55e",
  CONFIRMED: "#c9a227",
  PENDING: "#f59e0b",
  CANCELLED: "#ef4444",
  NO_SHOW: "#6b7280",
};

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });

  if (isLoading) return <PageSpinner />;

  const appointmentsByStatus = data?.appointmentsByStatus
    ? Object.entries(data.appointmentsByStatus).map(([status, count]) => ({
        name: status,
        value: count,
        fill: STATUS_COLORS[status] || "#c9a227",
      }))
    : [];

  const revenueData = data?.revenueByMonth || [];

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <p className="text-text-tertiary text-xs mb-1">Nuevos usuarios/mes</p>
          <p className="text-2xl font-bold text-primary">
            {data?.newUsersThisMonth || 0}
          </p>
        </Card>
        <Card>
          <p className="text-text-tertiary text-xs mb-1">Citas completadas/mes</p>
          <p className="text-2xl font-bold text-success">
            {data?.completedAppointmentsThisMonth || 0}
          </p>
        </Card>
      </div>

      {/* Revenue chart */}
      {revenueData.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Ingresos por mes
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111118",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  color: "#fff",
                }}
                formatter={(v: number) => [formatCOP(v), "Ingresos"]}
              />
              <Bar dataKey="revenue" fill="#c9a227" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Appointments by status */}
      {appointmentsByStatus.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">
            Citas por estado
          </h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {appointmentsByStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {appointmentsByStatus.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-xs text-text-secondary">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {appointmentsByStatus.length === 0 && revenueData.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-16 gap-3">
          <TrendingUp size={40} className="text-text-tertiary" />
          <p className="text-text-secondary">No hay datos analíticos aún</p>
        </div>
      )}
    </div>
  );
}
