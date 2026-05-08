"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Phone, ChevronRight, Scissors } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { authApi } from "@/lib/api/auth.api";
import { subscriptionsApi } from "@/lib/api/subscriptions.api";
import { paymentsApi } from "@/lib/api/payments.api";
import { formatCOP } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Plan } from "@/types";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    firstName: z.string().min(2, "Mínimo 2 caracteres"),
    lastName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z
      .string()
      .regex(
        /^(\+57|57)?3[0-9]{9}$/,
        "Teléfono colombiano inválido (+57 3XXXXXXXXX)"
      ),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["CLIENT", "BARBER"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "CLIENT" },
  });

  const role = watch("role");

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => subscriptionsApi.getPlans(),
    enabled: step === 2,
  });

  const plans = plansData || [];

  const onStep1Submit = async (data: FormData) => {
    setError("");
    if (data.role === "BARBER") {
      setFormData(data);
      setStep(2);
      return;
    }
    // CLIENT: register directly
    setIsLoading(true);
    try {
      await authApi.register(data);
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al registrarse";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const onPaySubscription = async () => {
    if (!formData || !selectedPlan) return;
    setIsLoading(true);
    setError("");
    try {
      await authApi.register(formData);
      const { checkoutUrl } = await paymentsApi.subscriptionCheckout({
        planName: selectedPlan.name,
      });
      window.open(checkoutUrl, "_blank");
      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(formData.email)}`
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al procesar";
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo variant="full" size="md" />
          <h2 className="text-lg font-bold text-white mt-4">Crear cuenta</h2>
          {step === 2 && (
            <p className="text-text-secondary text-sm mt-1">
              Selecciona tu plan de suscripción
            </p>
          )}
        </div>

        {/* Steps indicator */}
        {role === "BARBER" && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    step >= s
                      ? "bg-primary text-black"
                      : "bg-[rgba(255,255,255,0.08)] text-text-tertiary"
                  )}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5",
                      step > s ? "bg-primary" : "bg-[rgba(255,255,255,0.08)]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <form
            onSubmit={handleSubmit(onStep1Submit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nombre"
                placeholder="Juan"
                leftIcon={<User size={14} />}
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              <Input
                label="Apellido"
                placeholder="Pérez"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>
            <Input
              label="Correo"
              type="email"
              placeholder="tu@email.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Teléfono"
              placeholder="+573001234567"
              leftIcon={<Phone size={16} />}
              error={errors.phone?.message}
              hint="Formato: +57 3XXXXXXXXX"
              {...register("phone")}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Role selection */}
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">
                Tipo de cuenta
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["CLIENT", "BARBER"] as const).map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                      watch("role") === r
                        ? "border-primary bg-[rgba(201,162,39,0.08)] text-primary"
                        : "border-[rgba(255,255,255,0.08)] text-text-secondary hover:border-[rgba(255,255,255,0.15)]"
                    )}
                  >
                    <input
                      type="radio"
                      value={r}
                      className="hidden"
                      {...register("role")}
                    />
                    <Scissors size={18} />
                    <span className="text-xs font-medium">
                      {r === "CLIENT" ? "Cliente" : "Barbero"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={isSubmitting || isLoading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {role === "BARBER" ? (
                <>
                  Siguiente <ChevronRight size={16} />
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {plans.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : (
              plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedPlan?.id === plan.id
                      ? "border-primary bg-[rgba(201,162,39,0.05)]"
                      : "hover:border-[rgba(255,255,255,0.12)]"
                  )}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white">
                      {plan.displayName}
                    </h3>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedPlan?.id === plan.id
                          ? "border-primary bg-primary"
                          : "border-[rgba(255,255,255,0.2)]"
                      )}
                    >
                      {selectedPlan?.id === plan.id && (
                        <div className="w-2 h-2 rounded-full bg-black" />
                      )}
                    </div>
                  </div>
                  <p className="text-primary font-bold text-lg">
                    {formatCOP(plan.priceMonthly)}
                    <span className="text-text-secondary text-sm font-normal">
                      /mes
                    </span>
                  </p>
                  {plan.description && (
                    <p className="text-text-secondary text-xs mt-1">
                      {plan.description}
                    </p>
                  )}
                </Card>
              ))
            )}

            {error && (
              <div className="bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Atrás
              </Button>
              <Button
                loading={isLoading}
                disabled={!selectedPlan}
                onClick={onPaySubscription}
                className="flex-1"
              >
                Pagar con Wompi
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:text-primary-dark transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
