"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Scissors } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

const schema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace("/home");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; error?: string | string[] } } })?.response?.data;
      const raw = errData?.message ?? errData?.error ?? "Credenciales incorrectas";
      const msg = Array.isArray(raw) ? raw[0] : raw;

      // Email sin verificar: redirigir a OTP
      try {
        const parsed = JSON.parse(msg as string);
        if (parsed?.requiresVerification) {
          router.replace(`/auth/verify-otp?email=${encodeURIComponent(parsed.email)}`);
          return;
        }
      } catch { /* no es JSON */ }

      setError(msg as string);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[rgba(201,162,39,0.15)] rounded-2xl flex items-center justify-center mb-4 border border-[rgba(201,162,39,0.2)]">
            <Scissors size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gold-gradient">BarberProSuite</h1>
          <p className="text-text-secondary text-sm mt-1">
            Tu barbería favorita en un clic
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={16} />}
            error={errors.password?.message}
            {...register("password")}
          />

          {error && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={isSubmitting}
            fullWidth
            size="lg"
            className="mt-2"
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link
            href="/auth/verify-otp"
            className="block text-sm text-text-secondary hover:text-primary transition-colors"
          >
            ¿Tienes un código OTP?{" "}
            <span className="text-primary font-medium">Verificar</span>
          </Link>
          <p className="text-sm text-text-secondary">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
