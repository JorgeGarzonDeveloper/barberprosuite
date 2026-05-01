"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const setAuth = useAuthStore((s) => s.setAuth);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 6) {
      verifyCode(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      verifyCode(pasted);
    }
  };

  const verifyCode = async (code: string) => {
    if (!email) {
      setError("Email no encontrado. Vuelve a registrarte.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const res = await authApi.verifyOtp(email, code);
      setAuth(res.user, res.accessToken, res.refreshToken);
      router.replace("/home");
    } catch {
      setError("Código incorrecto o expirado");
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;
    setResendLoading(true);
    try {
      await authApi.resendOtp(email);
      setCountdown(60);
      setCanResend(false);
      setError("");
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError("Error al reenviar el código");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length === 6) verifyCode(code);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[rgba(201,162,39,0.15)] rounded-2xl flex items-center justify-center mb-4 border border-[rgba(201,162,39,0.2)]">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verificar cuenta</h1>
          {email ? (
            <p className="text-text-secondary text-sm mt-2 text-center">
              Enviamos un código a{" "}
              <span className="text-white font-medium">{email}</span>
            </p>
          ) : (
            <p className="text-text-secondary text-sm mt-2 text-center">
              Ingresa el código de 6 dígitos
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-error/20 rounded-xl px-4 py-3">
              <p className="text-error text-sm text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            fullWidth
            size="lg"
            disabled={otp.join("").length < 6}
          >
            Verificar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={!canResend || resendLoading}
            className="flex items-center gap-2 mx-auto text-sm text-text-secondary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              size={14}
              className={resendLoading ? "animate-spin" : ""}
            />
            {canResend
              ? "Reenviar código"
              : `Reenviar en ${countdown}s`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
