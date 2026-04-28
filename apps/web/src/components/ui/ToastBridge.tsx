"use client";

import { useEffect } from "react";
import { useToast, setGlobalToast } from "./Toast";

/** Registra el toast global para que api.ts pueda usarlo fuera de React */
export function ToastBridge() {
  const toastCtx = useToast();
  useEffect(() => { setGlobalToast(toastCtx); }, [toastCtx]);
  return null;
}
