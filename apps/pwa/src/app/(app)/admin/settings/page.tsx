"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { adminApi } from "@/lib/api/admin.api";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { Settings, ChevronLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => adminApi.getSettings(),
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      adminApi.updateSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Configuración</h1>
      </div>

      <form
        onSubmit={handleSubmit((v) => saveMutation.mutate(v as Record<string, unknown>))}
      >
        <Card className="mb-4">
          <h2 className="text-sm font-semibold text-white mb-4">General</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Nombre de la plataforma"
              placeholder="BarberProSuite"
              {...register("platformName")}
            />
            <Input
              label="Comisión por cita (%)"
              type="number"
              placeholder="10"
              {...register("commissionPercent")}
            />
            <Input
              label="Radio de búsqueda por defecto (metros)"
              type="number"
              placeholder="10000"
              {...register("defaultSearchRadius")}
            />
          </div>
        </Card>

        <Button
          type="submit"
          fullWidth
          loading={saveMutation.isPending}
          className="gap-2"
        >
          <Save size={16} />
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
