"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import BottomNav from "@/components/ui/BottomNav";
import Spinner from "@/components/ui/Spinner";

// Rutas accesibles sin autenticación dentro del layout de app
const PUBLIC_APP_ROUTES = ["/home"];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  const isPublicRoute = PUBLIC_APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) return null;

  return (
    <div className="bg-background min-h-screen">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
