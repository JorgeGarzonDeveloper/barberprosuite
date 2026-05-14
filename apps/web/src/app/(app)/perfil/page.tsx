"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { Camera, LogOut, ChevronRight, Calendar, Clock, Shield, HelpCircle, Scissors, BarChart3 } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout, setAvatarUrl } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["profile-stats"],
    queryFn: () => api.get("/appointments/my/stats").then((r) => r.data.data).catch(() => null),
    retry: false,
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarUrl(res.data.data?.avatarUrl ?? res.data.avatarUrl);
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch { /* ok */ } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => { logout(); router.replace("/login"); };

  const menuItems = [
    { label: "Mis citas", href: "/citas", icon: Calendar, color: "#a78bfa" },
    ...(user?.role === "BARBER" ? [
      { label: "Cola de espera", href: "/barber/cola", icon: Scissors, color: "#c9a227" },
      { label: "Mis servicios", href: "/barber/servicios", icon: Scissors, color: "#34d399" },
      { label: "Mi horario", href: "/barber/horario", icon: Clock, color: "#60a5fa" },
    ] : []),
    ...(user?.role === "ADMIN" ? [
      { label: "Panel de administración", href: "/admin", icon: BarChart3, color: "#fb923c" },
    ] : []),
    { label: "Soporte y ayuda", href: "/soporte", icon: HelpCircle, color: "#38bdf8" },
    { label: "Términos y condiciones", href: "/terminos", icon: Shield, color: "#6b7280" },
    { label: "Política de privacidad", href: "/privacidad", icon: Shield, color: "#6b7280" },
  ];

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto lg:pt-10">
      {/* Avatar + info */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-[#c9a227]/20 border-2 border-[#c9a227]/30 overflow-hidden flex items-center justify-center">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#c9a227] text-3xl font-bold">{user?.firstName?.[0]?.toUpperCase()}</span>}
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#c9a227] rounded-full flex items-center justify-center border-2 border-[#0a0a0f] hover:bg-[#e8cc6a] transition-colors disabled:opacity-50">
            <Camera size={14} className="text-black" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <h2 className="text-white text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
        <p className="text-white/40 text-sm">{user?.email}</p>
        <span className="mt-2 px-3 py-1 bg-[#c9a227]/15 text-[#c9a227] text-xs font-bold rounded-full border border-[#c9a227]/30 capitalize">
          {user?.role === "BARBER" ? "Barbero" : user?.role === "ADMIN" ? "Administrador" : "Cliente"}
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total citas", value: stats.total ?? 0 },
            { label: "Completadas", value: stats.completed ?? 0 },
            { label: "Próximas", value: stats.upcoming ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white text-xl font-bold">{s.value}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Menu */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
        {menuItems.map((item, i) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors ${i < menuItems.length - 1 ? "border-b border-white/5" : ""}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <span className="text-white text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight size={14} className="text-white/20" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold text-sm hover:bg-red-500/20 transition-all">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  );
}
