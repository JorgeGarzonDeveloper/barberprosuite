"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", role: "CLIENT",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      router.replace("/home");
    } catch {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            Barber<span className="text-[#c9a227]">Pro</span>Suite
          </Link>
          <p className="text-white/40 text-sm mt-2">Crea tu cuenta gratis</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? "bg-[#c9a227]" : "bg-white/10"}`} />
          ))}
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-5">

          {step === 1 && (
            <>
              <h2 className="text-white font-bold text-lg">Información personal</h2>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-white/60 text-xs font-medium mb-1 block">Nombre *</label>
                  <input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
                    placeholder="Juan" />
                </div>
                <div className="flex-1">
                  <label className="text-white/60 text-xs font-medium mb-1 block">Apellido *</label>
                  <input required value={form.lastName} onChange={(e) => set("lastName", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
                    placeholder="Pérez" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1 block">Correo *</label>
                <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
                  placeholder="tu@correo.com" />
              </div>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1 block">Teléfono *</label>
                <input type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
                  placeholder="+57 300 0000000" />
              </div>
              <button type="submit" className="w-full bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl transition-all">
                Siguiente →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-white font-bold text-lg">Cuenta y rol</h2>
              <div>
                <label className="text-white/60 text-xs font-medium mb-2 block">¿Cómo usarás la app?</label>
                <div className="flex flex-col gap-2">
                  {[{ v: "CLIENT", label: "Cliente", desc: "Reservo citas y uso la cola virtual" },
                    { v: "BARBER", label: "Barbero", desc: "Atiendo clientes y gestiono mi agenda" }].map((o) => (
                    <button key={o.v} type="button"
                      onClick={() => set("role", o.v)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${form.role === o.v ? "border-[#c9a227] bg-[#c9a227]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.role === o.v ? "border-[#c9a227] bg-[#c9a227]" : "border-white/30"}`} />
                      <div>
                        <p className={`text-sm font-bold ${form.role === o.v ? "text-[#c9a227]" : "text-white"}`}>{o.label}</p>
                        <p className="text-white/40 text-xs">{o.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs font-medium mb-1 block">Contraseña *</label>
                <input type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#c9a227]/50"
                  placeholder="Mínimo 6 caracteres" />
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 bg-white/5 border border-white/10 text-white/60 font-semibold py-3 rounded-xl hover:bg-white/10 transition-all">
                  ← Atrás
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 bg-[#c9a227] hover:bg-[#e8cc6a] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {isLoading ? "Creando..." : "Crear cuenta"}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-white/40 text-sm mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-[#c9a227] hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
