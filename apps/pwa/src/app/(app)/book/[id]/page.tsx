"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { barbershopsApi } from "@/lib/api/barbershops.api";
import { barberApi } from "@/lib/api/barber.api";
import { paymentsApi } from "@/lib/api/payments.api";
import { Barber, Service } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCOP, cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, CreditCard, Scissors } from "lucide-react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { addDays, format, isSunday, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { getInitials } from "@/lib/utils";

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const hour = Math.floor((i * 30) / 60) + 8;
  const min = (i * 30) % 60;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
});

function BookContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedBarberId = searchParams.get("barberId");

  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const { data: shop, isLoading } = useQuery({
    queryKey: ["barbershop", id],
    queryFn: () => barbershopsApi.getById(id),
  });

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ["barber-services", selectedBarber?.id],
    queryFn: () => barberApi.getServicesByBarber(selectedBarber!.id),
    enabled: !!selectedBarber,
  });

  const services = servicesData?.data || [];

  useEffect(() => {
    if (preselectedBarberId && shop?.barbers) {
      const barber = shop.barbers.find((b) => b.id === preselectedBarberId);
      if (barber) {
        setSelectedBarber(barber);
        setStep(2);
      }
    }
  }, [preselectedBarberId, shop]);

  // Date range: 7 days from today excluding Sundays
  const availableDates = Array.from({ length: 14 }, (_, i) =>
    addDays(startOfDay(new Date()), i + 1)
  ).filter((d) => !isSunday(d)).slice(0, 7);

  const totalPrice = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const commission = Math.round(totalPrice * 0.1);
  const grandTotal = totalPrice + commission;

  const checkoutMutation = useMutation({
    mutationFn: () => {
      if (!selectedBarber || !selectedDate || !selectedTime)
        throw new Error("Datos incompletos");
      const scheduled = new Date(selectedDate);
      const [h, m] = selectedTime.split(":").map(Number);
      scheduled.setHours(h, m, 0, 0);
      return paymentsApi.appointmentCheckout({
        barbershopId: id,
        barberId: selectedBarber.id,
        serviceIds: selectedServices.map((s) => s.id),
        scheduledAt: scheduled.toISOString(),
        notes: notes || undefined,
      });
    },
    onSuccess: ({ checkoutUrl }) => {
      window.open(checkoutUrl, "_blank");
      router.push("/appointments");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al crear la cita";
      setError(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const stepLabels = ["Barbero", "Servicios", "Fecha & Hora", "Pago"];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="page-container">
      {/* Back */}
      <button
        onClick={() => (step > 1 ? setStep((s) => s - 1) : router.back())}
        className="flex items-center gap-1.5 text-text-secondary hover:text-white mb-6 text-sm"
      >
        <ChevronLeft size={18} /> Atrás
      </button>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step > i + 1
                  ? "bg-success text-white"
                  : step === i + 1
                  ? "bg-primary text-black"
                  : "bg-[rgba(255,255,255,0.08)] text-text-tertiary"
              )}
            >
              {step > i + 1 ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs",
                step === i + 1 ? "text-white font-medium" : "text-text-tertiary"
              )}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <ChevronRight size={14} className="text-text-tertiary" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select barber */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Selecciona tu barbero
          </h2>
          <div className="flex flex-col gap-3">
            {shop?.barbers.map((barber) => (
              <button
                key={barber.id}
                onClick={() => {
                  setSelectedBarber(barber);
                  setSelectedServices([]);
                  setStep(2);
                }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                  selectedBarber?.id === barber.id
                    ? "border-primary bg-[rgba(201,162,39,0.08)]"
                    : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)]"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center font-bold text-primary">
                  {getInitials(barber.user.firstName, barber.user.lastName)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {barber.user.firstName} {barber.user.lastName}
                  </p>
                  {barber.specialties && (
                    <p className="text-text-secondary text-xs">
                      {barber.specialties}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    barber.isAvailable ? "bg-success" : "bg-error"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select services */}
      {step === 2 && selectedBarber && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Selecciona servicios
          </h2>
          {servicesLoading ? (
            <PageSpinner />
          ) : services.length > 0 ? (
            <>
              <div className="flex flex-col gap-2 mb-6">
                {services.map((service) => {
                  const selected = selectedServices.some(
                    (s) => s.id === service.id
                  );
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedServices((prev) =>
                          selected
                            ? prev.filter((s) => s.id !== service.id)
                            : [...prev, service]
                        );
                      }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                        selected
                          ? "border-primary bg-[rgba(201,162,39,0.08)]"
                          : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                          selected
                            ? "bg-primary border-primary"
                            : "border-[rgba(255,255,255,0.2)]"
                        )}
                      >
                        {selected && <Check size={12} className="text-black" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-text-secondary text-xs">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-primary text-sm font-semibold">
                          {formatCOP(service.price)}
                        </p>
                        <p className="text-text-tertiary text-xs">
                          {service.durationMinutes}min
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button
                fullWidth
                disabled={selectedServices.length === 0}
                onClick={() => setStep(3)}
              >
                Continuar ({selectedServices.length} seleccionado
                {selectedServices.length !== 1 ? "s" : ""})
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <Scissors size={32} className="text-text-tertiary mx-auto mb-2" />
              <p className="text-text-secondary">No hay servicios disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date & Time */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">
            Selecciona fecha y hora
          </h2>

          {/* Date picker */}
          <div className="mb-6">
            <label className="text-xs text-text-tertiary uppercase tracking-wide mb-3 block">
              Fecha
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableDates.map((date) => {
                const isSelected =
                  selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl border transition-all shrink-0",
                      isSelected
                        ? "border-primary bg-[rgba(201,162,39,0.08)] text-primary"
                        : "border-[rgba(255,255,255,0.08)] text-text-secondary hover:border-[rgba(255,255,255,0.15)]"
                    )}
                  >
                    <span className="text-xs uppercase">
                      {format(date, "EEE", { locale: es })}
                    </span>
                    <span className="text-lg font-bold">{format(date, "d")}</span>
                    <span className="text-xs">{format(date, "MMM", { locale: es })}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="mb-6">
              <label className="text-xs text-text-tertiary uppercase tracking-wide mb-3 block">
                Hora
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-2.5 rounded-xl border text-sm font-medium transition-all",
                      selectedTime === time
                        ? "border-primary bg-[rgba(201,162,39,0.08)] text-primary"
                        : "border-[rgba(255,255,255,0.08)] text-text-secondary hover:border-[rgba(255,255,255,0.15)]"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            fullWidth
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(4)}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Step 4: Summary & Payment */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Resumen y pago</h2>

          <Card className="mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Scissors size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-text-tertiary">Barbero</p>
                  <p className="text-sm text-white font-medium">
                    {selectedBarber?.user.firstName}{" "}
                    {selectedBarber?.user.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-text-tertiary">Fecha y hora</p>
                  <p className="text-sm text-white font-medium">
                    {selectedDate &&
                      format(selectedDate, "EEEE d 'de' MMMM", {
                        locale: es,
                      })}{" "}
                    - {selectedTime}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Servicios</h3>
            {selectedServices.map((s) => (
              <div
                key={s.id}
                className="flex justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0"
              >
                <span className="text-text-secondary text-sm">{s.name}</span>
                <span className="text-white text-sm">{formatCOP(s.price)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3">
              <span className="text-text-secondary text-sm">Subtotal</span>
              <span className="text-white text-sm">{formatCOP(totalPrice)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-text-secondary text-sm">
                Comisión plataforma (10%)
              </span>
              <span className="text-white text-sm">{formatCOP(commission)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[rgba(255,255,255,0.08)] mt-3">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-primary text-lg">
                {formatCOP(grandTotal)}
              </span>
            </div>
          </Card>

          {/* Notes */}
          <div className="mb-4">
            <label className="text-sm text-text-secondary mb-2 block">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Corte específico, preferencias..."
              rows={3}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && (
            <div className="mb-4 bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <Button
            loading={checkoutMutation.isPending}
            fullWidth
            size="lg"
            onClick={() => checkoutMutation.mutate()}
            className="gap-2"
          >
            <CreditCard size={18} />
            Pagar con Wompi — {formatCOP(grandTotal)}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <BookContent />
    </Suspense>
  );
}
