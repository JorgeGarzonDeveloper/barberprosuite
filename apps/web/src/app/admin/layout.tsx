"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, Scissors, BarChart3, CreditCard,
  RotateCcw, DollarSign, Bell, LogOut, Menu, X,
  Calendar, UsersRound, Settings,
} from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics",     label: "Analíticas",     icon: BarChart3 },
  { href: "/admin/users",         label: "Usuarios",       icon: Users },
  { href: "/admin/barbershops",   label: "Barberías",      icon: Scissors },
  { href: "/admin/appointments",  label: "Citas",          icon: Calendar },
  { href: "/admin/queue",         label: "Cola virtual",   icon: UsersRound },
  { href: "/admin/subscriptions", label: "Suscripciones",  icon: CreditCard },
  { href: "/admin/payouts",       label: "Cuadre de pagos",icon: DollarSign },
  { href: "/admin/refunds",       label: "Devoluciones",   icon: RotateCcw },
  { href: "/admin/notifications", label: "Notificaciones", icon: Bell },
  { href: "/admin/settings",      label: "Configuración",  icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_user");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (userData) setUser(JSON.parse(userData));
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const Sidebar = () => (
    <aside className="flex flex-col w-64 bg-[#0d0d14] border-r border-white/10 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">
          Barber<span className="text-[#c9a227]">Pro</span>Suite
        </h1>
        <p className="text-white/30 text-xs mt-1">Panel Admin</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/30"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-[#c9a227] font-bold text-sm">
              {user.firstName?.[0] ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/30 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d0d14]">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={22} />
          </button>
          <span className="text-white font-bold text-sm">
            Barber<span className="text-[#c9a227]">Pro</span>Suite Admin
          </span>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
