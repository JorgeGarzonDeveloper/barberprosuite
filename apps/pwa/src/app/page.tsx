"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import Spinner from "@/components/ui/Spinner";
import Logo from "@/components/ui/Logo";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      // Todos van a /home — autenticado o invitado
      router.replace("/home");
    }
  }, [isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        <Logo variant="full" size="lg" />
        <Spinner size="md" />
      </div>
    </div>
  );
}
