"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queueApi } from "@/lib/api/queue.api";
import { Barber } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { QrCode, Keyboard, User, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";

export default function ScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [qrSecret, setQrSecret] = useState("");
  const [barbershopId, setBarbershopId] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);

  const { data: barbersData } = useQuery({
    queryKey: ["queue-barbers", barbershopId],
    queryFn: () => queueApi.getBarbers(barbershopId),
    enabled: !!barbershopId,
  });

  const barbers: Barber[] = barbersData?.data || [];

  const joinMutation = useMutation({
    mutationFn: async () => {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        if (!navigator.geolocation) rej(new Error("Geolocation not supported"));
        else navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
      }).catch(() => null);

      return queueApi.join({
        barbershopId,
        qrSecret,
        latitude: pos?.coords.latitude ?? 4.711,
        longitude: pos?.coords.longitude ?? -74.0721,
        preferredBarberId: selectedBarberId,
      });
    },
    onSuccess: (data) => {
      setSuccess(true);
      setShowBarberModal(false);
      setTimeout(() => router.push(`/queue/${data.entry.id}`), 1500);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Error al unirse a la cola";
      setError(Array.isArray(msg) ? msg[0] : msg);
      setShowBarberModal(false);
    },
  });

  useEffect(() => {
    if (mode !== "camera") return;

    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;
    scannedRef.current = false;

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        qr.stop().catch(() => {});
        handleQrResult(decoded);
      },
      () => {}
    ).catch(() => {
      setMode("manual");
    });

    return () => {
      qr.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleQrResult = (data: string) => {
    // Expected format: "barbershopId:qrSecret" or just the secret
    try {
      const parsed = JSON.parse(data);
      if (parsed.barbershopId && parsed.secret) {
        setBarbershopId(parsed.barbershopId);
        setQrSecret(parsed.secret);
        setShowBarberModal(true);
        return;
      }
    } catch {}
    // Try plain format
    const parts = data.split(":");
    if (parts.length >= 2) {
      setBarbershopId(parts[0]);
      setQrSecret(parts.slice(1).join(":"));
      setShowBarberModal(true);
    } else {
      setQrSecret(data);
      setShowBarberModal(true);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleQrResult(manualCode.trim());
  };

  if (success) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h2 className="text-xl font-bold text-white">¡Unido a la cola!</h2>
        <p className="text-text-secondary text-sm mt-2">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold text-white mb-2">Escanear QR</h1>
      <p className="text-text-secondary text-sm mb-6">
        Escanea el código QR de la barbería para unirte a la cola
      </p>

      {/* Mode tabs */}
      <div className="flex bg-[rgba(255,255,255,0.04)] rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode("camera")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "camera"
              ? "bg-primary text-black"
              : "text-text-secondary hover:text-white"
          )}
        >
          <QrCode size={16} />
          Cámara
        </button>
        <button
          onClick={() => {
            if (mode === "camera" && scannerRef.current) {
              scannerRef.current.stop().catch(() => {});
            }
            setMode("manual");
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "manual"
              ? "bg-primary text-black"
              : "text-text-secondary hover:text-white"
          )}
        >
          <Keyboard size={16} />
          Manual
        </button>
      </div>

      {mode === "camera" && (
        <div className="relative">
          <div
            id="qr-reader"
            className="w-full rounded-2xl overflow-hidden"
            style={{ minHeight: 300 }}
          />
          {/* Overlay corners */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            </div>
          </div>
          <p className="text-text-secondary text-xs text-center mt-3">
            Apunta la cámara al código QR de la barbería
          </p>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">
              Código de la barbería
            </label>
            <input
              type="text"
              placeholder="Ingresa el código o ID de la barbería"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-white text-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
            />
          </div>
          <Button
            onClick={handleManualSubmit}
            fullWidth
            disabled={!manualCode.trim()}
          >
            Continuar
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Barber selection modal */}
      <Modal
        isOpen={showBarberModal}
        onClose={() => setShowBarberModal(false)}
        title="Seleccionar barbero (opcional)"
      >
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setSelectedBarberId(undefined);
              joinMutation.mutate();
            }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              !selectedBarberId
                ? "border-primary bg-[rgba(201,162,39,0.08)]"
                : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <User size={18} className="text-text-secondary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Cualquier barbero</p>
              <p className="text-xs text-text-secondary">El disponible más pronto</p>
            </div>
          </button>

          {barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                selectedBarberId === barber.id
                  ? "border-primary bg-[rgba(201,162,39,0.08)]"
                  : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-[rgba(201,162,39,0.15)] flex items-center justify-center text-sm font-bold text-primary">
                {barber.user.firstName.charAt(0)}{barber.user.lastName.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">
                  {barber.user.firstName} {barber.user.lastName}
                </p>
                {barber.specialties && (
                  <p className="text-xs text-text-secondary truncate">
                    {barber.specialties}
                  </p>
                )}
              </div>
              {!barber.isAvailable && (
                <span className="ml-auto text-xs text-error">No disponible</span>
              )}
            </button>
          ))}

          {selectedBarberId && (
            <Button
              loading={joinMutation.isPending}
              fullWidth
              onClick={() => joinMutation.mutate()}
              className="mt-2"
            >
              Unirme a la cola
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
