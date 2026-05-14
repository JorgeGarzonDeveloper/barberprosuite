"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      router.replace("/home");
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Barber<span className="text-[#c9a227]">Pro</span>Suite
          </Link>
          <p className="text-white/40 text-sm mt-2">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <label className="text-white/60 text-sm font-medium mb-2 block">Correo electrónico</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="text-white/60 text-sm font-medium mb-2 block">Contraseña</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-5">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-[#c9a227] hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
