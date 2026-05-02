"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { barberApi } from "@/lib/api/barber.api";
import { BarberService } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, cn } from "@/lib/utils";
import { Plus, Edit2, Trash2, Scissors, Clock, DollarSign } from "lucide-react";

const serviceSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(1000, "Precio mínimo $1.000"),
  durationMinutes: z.coerce
    .number()
    .min(5, "Mínimo 5 minutos")
    .max(240, "Máximo 240 minutos"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function BarberServicesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<BarberService | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-services"],
    queryFn: () => barberApi.getMyServices(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const createMutation = useMutation({
    mutationFn: (payload: ServiceFormData) =>
      barberApi.createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      setShowModal(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      barberApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      setShowModal(false);
      setEditingService(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => barberApi.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-services"] });
      setShowDeleteModal(false);
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditingService(null);
    reset({});
    setShowModal(true);
  };

  const openEdit = (service: BarberService) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const services = data?.data || [];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Mis servicios</h1>
          <p className="text-text-secondary text-sm">{services.length} registrados</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus size={16} />
          Agregar
        </Button>
      </div>

      {services.length > 0 ? (
        <div className="flex flex-col gap-3">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{service.name}</h3>
                    {!service.isActive && (
                      <span className="text-xs text-error bg-[rgba(239,68,68,0.1)] px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="text-text-secondary text-xs mt-0.5">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-3 shrink-0">
                  <button
                    onClick={() => openEdit(service)}
                    className="p-2 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-text-secondary hover:text-white transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(service.id);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-lg bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.15)] text-error transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-primary font-semibold">
                  <DollarSign size={13} />
                  {formatCOP(service.price)}
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <Clock size={13} />
                  {service.durationMinutes} min
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center mt-16 gap-4">
          <Scissors size={48} className="text-text-tertiary" />
          <div className="text-center">
            <p className="text-white font-medium">Sin servicios</p>
            <p className="text-text-secondary text-sm mt-1">
              Agrega los servicios que ofreces
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Agregar primer servicio
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingService(null);
          reset();
        }}
        title={editingService ? "Editar servicio" : "Nuevo servicio"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre del servicio"
            placeholder="Ej: Corte clásico"
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Descripción (opcional)"
            placeholder="Breve descripción..."
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio (COP)"
              type="number"
              placeholder="25000"
              error={errors.price?.message}
              leftIcon={<DollarSign size={14} />}
              {...register("price")}
            />
            <Input
              label="Duración (min)"
              type="number"
              placeholder="30"
              error={errors.durationMinutes?.message}
              leftIcon={<Clock size={14} />}
              {...register("durationMinutes")}
            />
          </div>
          <Button
            type="submit"
            loading={isSubmitting || createMutation.isPending || updateMutation.isPending}
            fullWidth
          >
            {editingService ? "Guardar cambios" : "Crear servicio"}
          </Button>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
        title="¿Eliminar servicio?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            Esta acción no se puede deshacer. El servicio será eliminado
            permanentemente.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
