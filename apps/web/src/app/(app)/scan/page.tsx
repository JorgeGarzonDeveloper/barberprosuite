"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth.store";
import { api } from "@/lib/api";
import { QrCode, Camera, Upload, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const [detectedId, setDetectedId] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Extrae barbershopId de una URL de BarberProSuite o string raw
  function extractBarbershopId(raw: string): string | null {
    try {
      const url = new URL(raw);
      // /barbershop/:id o /barbershop/:id/join o ?barbershopId=xxx
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("barbershop");
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      const param = url.searchParams.get("barbershopId") ?? url.searchParams.get("id");
      if (param) return param;
    } catch {
      // Raw UUID
      if (/^[0-9a-f-]{36}$/i.test(raw.trim())) return raw.trim();
    }
    return null;
  }

  async function handleQrValue(value: string) {
    const barbershopId = extractBarbershopId(value);
    if (!barbershopId) {
      setResult({ type: "error", message: "QR inválido — no es un código de BarberProSuite" });
      return;
    }
    setDetectedId(barbershopId);
    stopCamera();
    await joinQueue(barbershopId);
  }

  async function joinQueue(barbershopId: string) {
    setJoining(true);
    try {
      await api.post(`/queue/${barbershopId}/join`);
      setResult({ type: "success", message: "Te uniste a la cola exitosamente" });
      setTimeout(() => router.push("/cola"), 1800);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e.message ?? "No se pudo unir a la cola";
      setResult({ type: "error", message: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setJoining(false);
    }
  }

  async function startCamera() {
    setCameraError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setScanning(true);
      scanLoop();
    } catch (e: any) {
      if (e.name === "NotAllowedError") setCameraError("Permiso de cámara denegado. Permite el acceso en la configuración del navegador.");
      else if (e.name === "NotFoundError") setCameraError("No se encontró una cámara disponible.");
      else setCameraError("No se pudo acceder a la cámara.");
    }
  }

  function scanLoop() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tick = async () => {
      if (!streamRef.current || video.paused || video.ended) return;
      if (video.readyState < 2) { animFrameRef.current = requestAnimationFrame(tick); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // BarcodeDetector API (Chrome 83+)
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) {
            await handleQrValue(barcodes[0].rawValue);
            return;
          }
        }
      } catch {}

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }

  async function handleFileUpload(file: File) {
    setResult(null);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      try {
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(canvas);
          if (barcodes.length > 0) { await handleQrValue(barcodes[0].rawValue); return; }
          setResult({ type: "error", message: "No se detectó un QR en la imagen." });
        } else {
          setResult({ type: "error", message: "Tu navegador no soporta lectura de QR. Usa Chrome." });
        }
      } catch {
        setResult({ type: "error", message: "Error al leer la imagen. Intenta con otra." });
      }
    };
    img.src = url;
  }

  const isBarber = user?.role === "BARBER" || user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white">Escanear QR</h1>
        <p className="text-white/40 text-sm mt-1">Apunta la cámara al código QR de tu barbería para unirte a la cola</p>
      </div>

      {isBarber ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <QrCode size={64} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg font-semibold">Función de cliente</p>
            <p className="text-white/20 text-sm mt-2">Los barberos gestionan su cola desde "Mi Cola"</p>
            <button onClick={() => router.push("/barber/cola")}
              className="mt-6 px-6 py-3 bg-[#c9a227] text-[#0a0a0f] font-bold rounded-xl text-sm">
              Ir a Mi Cola
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center px-4 pb-8">
          {/* Resultado */}
          {result && (
            <div className={`w-full max-w-sm mb-6 p-4 rounded-2xl border flex items-start gap-3 ${
              result.type === "success" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
            }`}>
              {result.type === "success"
                ? <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                : <XCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />}
              <p className={`text-sm font-medium ${result.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {result.message}
              </p>
            </div>
          )}

          {joining && (
            <div className="w-full max-w-sm mb-6 p-4 rounded-2xl bg-[#c9a227]/10 border border-[#c9a227]/30 flex items-center gap-3">
              <Loader2 size={20} className="text-[#c9a227] animate-spin" />
              <p className="text-[#c9a227] text-sm font-medium">Uniéndote a la cola...</p>
            </div>
          )}

          {/* Visor de cámara */}
          <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 mb-6">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`} />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <QrCode size={72} className="text-white/15" />
                <p className="text-white/30 text-sm text-center px-4">
                  {cameraError || "Toca el botón para activar la cámara"}
                </p>
              </div>
            )}

            {/* Marco QR animado */}
            {cameraActive && scanning && (
              <div className="absolute inset-6 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#c9a227] rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#c9a227] rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#c9a227] rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#c9a227] rounded-br-lg" />
                <div className="absolute left-0 right-0 h-0.5 bg-[#c9a227]/60 animate-scan" style={{ top: "50%" }} />
              </div>
            )}

            {cameraActive && (
              <button onClick={stopCamera}
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white/60 hover:text-white text-lg">
                ×
              </button>
            )}
          </div>

          {cameraError && (
            <div className="w-full max-w-sm mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{cameraError}</p>
            </div>
          )}

          {/* Botones */}
          <div className="w-full max-w-sm space-y-3">
            {!cameraActive ? (
              <button onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#c9a227] hover:bg-[#c9a227]/90 text-[#0a0a0f] font-bold rounded-2xl text-base transition-all">
                <Camera size={20} /> Activar cámara
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 bg-[#c9a227]/10 border border-[#c9a227]/30 rounded-2xl">
                <div className="w-2 h-2 bg-[#c9a227] rounded-full animate-pulse" />
                <span className="text-[#c9a227] text-sm font-semibold">Buscando código QR...</span>
              </div>
            )}

            <label className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-white/10 text-white/60 font-semibold rounded-2xl text-sm cursor-pointer hover:bg-white/10 transition-all">
              <Upload size={18} /> Subir imagen con QR
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
            </label>
          </div>

          <p className="text-white/20 text-xs text-center mt-6 max-w-xs">
            Escanea el QR de tu barbería para unirte a la cola virtual. También puedes subir una imagen del QR desde tu galería.
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
