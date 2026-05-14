"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import { Home, Map, Calendar, User, Bell, Users, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

function BottomNav() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const { data: unread } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => api.get("/notifications?limit=1&unread=true").then((r) => r.data.data?.total ?? 0),
    retry: false,
    refetchInterval: 30000,
  });

  const clientNav = [
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/mapa", icon: Map, label: "Mapa" },
    { href: "/citas", icon: Calendar, label: "Citas" },
    { href: "/notificaciones", icon: Bell, label: "Notis", badge: unread },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  const barberNav = [
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/barber/cola", icon: Users, label: "Cola" },
    { href: "/citas", icon: Calendar, label: "Citas" },
    { href: "/notificaciones", icon: Bell, label: "Notis", badge: unread },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  const adminNav = [
    { href: "/admin", icon: BarChart3, label: "Admin" },
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/notificaciones", icon: Bell, label: "Notis", badge: unread },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  const navItems =
    user?.role === "ADMIN" ? adminNav :
    user?.role === "BARBER" ? barberNav :
    clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d14] border-t border-white/10 flex lg:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors ${active ? "text-[#c9a227]" : "text-white/30"}`}>
            <div className="relative">
              <item.icon size={22} />
              {(item as any).badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {(item as any).badge > 9 ? "9+" : (item as any).badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const clientNav = [
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/mapa", icon: Map, label: "Mapa" },
    { href: "/citas", icon: Calendar, label: "Mis citas" },
    { href: "/notificaciones", icon: Bell, label: "Notificaciones" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  const barberNav = [
    { href: "/home", icon: Home, label: "Inicio" },
    { href: "/barber/cola", icon: Users, label: "Cola de espera" },
    { href: "/citas", icon: Calendar, label: "Citas" },
    { href: "/notificaciones", icon: Bell, label: "Notificaciones" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ];

  const navItems = user?.role === "BARBER" ? barberNav : clientNav;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0d0d14] border-r border-white/10 min-h-screen fixed top-0 left-0 bottom-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/home" className="text-xl font-bold text-white">
          Barber<span className="text-[#c9a227]">Pro</span>Suite
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? "bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
        {user?.role === "ADMIN" && (
          <Link href="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${pathname.startsWith("/admin") ? "bg-[#c9a227]/15 text-[#c9a227] border border-[#c9a227]/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
            <BarChart3 size={18} />Panel Admin
          </Link>
        )}
      </nav>
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/20 flex items-center justify-center text-[#c9a227] font-bold text-sm overflow-hidden">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : user.firstName?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-white/30 text-xs capitalize">{user.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <button onClick={() => { logout(); router.push("/login"); }}
          className="w-full text-left px-4 py-2 text-white/40 hover:text-red-400 text-sm rounded-xl hover:bg-red-500/10 transition-all">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="pb-20 lg:pb-8 min-h-screen">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
