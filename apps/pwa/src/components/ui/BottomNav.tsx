"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import {
  Calendar,
  Home,
  Map,
  QrCode,
  User,
  Users,
  LayoutDashboard,
  Scissors,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const clientItems: NavItem[] = [
  { href: "/home", icon: <Home size={22} />, label: "Inicio" },
  { href: "/map", icon: <Map size={22} />, label: "Mapa" },
  { href: "/scan", icon: <QrCode size={22} />, label: "Escanear" },
  { href: "/appointments", icon: <Calendar size={22} />, label: "Citas" },
  { href: "/profile", icon: <User size={22} />, label: "Perfil" },
];

const barberItems: NavItem[] = [
  { href: "/home", icon: <Home size={22} />, label: "Inicio" },
  { href: "/barber-queue", icon: <Users size={22} />, label: "Cola" },
  { href: "/appointments", icon: <Calendar size={22} />, label: "Citas" },
  { href: "/profile", icon: <User size={22} />, label: "Perfil" },
];

const adminItems: NavItem[] = [
  { href: "/home", icon: <Home size={22} />, label: "Inicio" },
  { href: "/admin", icon: <LayoutDashboard size={22} />, label: "Admin" },
  { href: "/appointments", icon: <Calendar size={22} />, label: "Citas" },
  { href: "/profile", icon: <User size={22} />, label: "Perfil" },
];

export default function BottomNav() {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const items =
    user?.role === "ADMIN"
      ? adminItems
      : user?.role === "BARBER"
      ? barberItems
      : clientItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d14]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.06)] safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2 pb-safe">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <span
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-text-tertiary"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
