"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin.api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Bell, ChevronLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const schema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres"),
  body: z.string().min(5, "Mínimo 5 caracteres"),
});

type FormData = z.infer<typeof schema>;

const roleOptions = [
  { value: "ALL", label: "Todos" },
  { value: "CLIENT", label: "Clientes" },
  { value: "BARBER", label: "Barberos" },
];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const sendMutation = useMutation({
    mutationFn: (data: FormData) =>
      adminApi.sendNotification({
        title: data.title,
        body: data.body,
        roles: selectedRole === "ALL" ? undefined : [selectedRole],
      }),
    onSuccess: () => {
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Notificaciones</h1>
      </div>

      {success && (
        <div className="mb-4 bg-[rgba(34,197,94,0.1)] border border-success/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-success" />
          <p className="text-success text-sm">Notificación enviada exitosamente</p>
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">
          Enviar notificación push
        </h2>

        {/* Audience */}
        <div className="mb-4">
          <label className="text-sm text-text-secondary mb-2 block">
            Destinatarios
          </label>
          <div className="flex gap-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedRole(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                  selectedRole === opt.value
                    ? "border-primary bg-[rgba(201,162,39,0.08)] text-primary"
                    : "border-[rgba(255,255,255,0.08)] text-text-secondary hover:border-[rgba(255,255,255,0.15)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit((data) => sendMutation.mutate(data))}
          className="flex flex-col gap-4"
        >
          <Input
            label="Título"
            placeholder="Título de la notificación"
            leftIcon={<Bell size={14} />}
            error={errors.title?.message}
            {...register("title")}
          />
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">
              Mensaje
            </label>
            <textarea
              placeholder="Escribe el mensaje de la notificación..."
              rows={4}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
              {...register("body")}
            />
            {errors.body && (
              <p className="text-xs text-error mt-1">{errors.body.message}</p>
            )}
          </div>
          <Button
            type="submit"
            fullWidth
            loading={isSubmitting || sendMutation.isPending}
            className="gap-2"
          >
            <Bell size={16} />
            Enviar notificación
          </Button>
        </form>
      </Card>
    </div>
  );
}
