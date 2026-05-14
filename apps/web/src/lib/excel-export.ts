import * as XLSX from "xlsx";

function fmtCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n ?? 0);
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename, { bookType: "xlsx", type: "binary" });
}

// ── Cuadre de pagos a barberos ────────────────────────────────────────────────
export function exportPayoutsExcel(payouts: any[]) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen por barbero
  const summary = payouts.map((b) => ({
    "Barbero": `${b.firstName} ${b.lastName}`,
    "Barbería": b.barbershopName,
    "Email": b.email,
    "Teléfono": b.phone ?? "",
    "Nº Citas": b.transactions?.length ?? 0,
    "Total a Consignar (COP)": b.totalOwed,
    "Total a Consignar Formato": fmtCOP(b.totalOwed),
  }));
  const ws1 = XLSX.utils.json_to_sheet(summary);
  ws1["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 16 },
    { wch: 10 }, { wch: 24 }, { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumen Barberos");

  // Hoja 2: Detalle de transacciones
  const detail: any[] = [];
  payouts.forEach((b) => {
    (b.transactions ?? []).forEach((tx: any) => {
      detail.push({
        "Barbero": `${b.firstName} ${b.lastName}`,
        "Barbería": b.barbershopName,
        "Email Barbero": b.email,
        "Fecha Cita": fmtDate(tx.date),
        "Servicio": tx.service,
        "Monto Total Cita (COP)": tx.amount,
        "Comisión Plataforma (COP)": tx.commissionAmount,
        "Monto Barbero (COP)": tx.barberAmount,
      });
    });
  });
  const ws2 = XLSX.utils.json_to_sheet(detail);
  ws2["!cols"] = [
    { wch: 28 }, { wch: 22 }, { wch: 30 }, { wch: 14 },
    { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Detalle Transacciones");

  download(wb, `cuadre_barberos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Devoluciones ─────────────────────────────────────────────────────────────
const REFUND_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En revisión",
  RESOLVED: "Aprobada",
  CLOSED: "Rechazada",
};

export function exportRefundsExcel(tickets: any[]) {
  const wb = XLSX.utils.book_new();

  const rows = tickets.map((t) => ({
    "Cliente": `${t.user?.firstName ?? ""} ${t.user?.lastName ?? ""}`.trim(),
    "Email": t.user?.email ?? "",
    "Asunto / Referencia de pago": t.subject ?? "",
    "Estado": REFUND_STATUS_LABELS[t.status] ?? t.status,
    "Fecha Solicitud": fmtDate(t.createdAt),
    "Tiene Comprobante": t.attachmentUrl ? "Sí" : "No",
    "URL Comprobante": t.attachmentUrl ?? "",
    "Respuesta Admin": t.replies?.filter((r: any) => r.isAdmin).map((r: any) => r.message).join(" | ") ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 28 }, { wch: 30 }, { wch: 50 }, { wch: 14 },
    { wch: 16 }, { wch: 18 }, { wch: 50 }, { wch: 60 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Devoluciones");

  download(wb, `devoluciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Transacciones completas ───────────────────────────────────────────────────
export function exportTransactionsExcel(transactions: any[]) {
  const wb = XLSX.utils.book_new();

  const rows = transactions.map((t) => ({
    "ID Pago": t.id,
    "Fecha": fmtDate(t.fecha),
    "Tipo": t.tipo,
    "Estado": t.estado,
    "Método": t.metodo,
    "Referencia Wompi": t.referencia,
    "Monto Total (COP)": t.monto_total,
    "Comisión Plataforma (COP)": t.comision_plataforma,
    "Monto Barbero (COP)": t.monto_barbero,
    "Cliente": t.cliente,
    "Email Cliente": t.email_cliente,
    "Barbero": t.barbero,
    "Barbería": t.barberia,
    "Plan Suscripción": t.plan_suscripcion,
    "Servicio": t.servicio,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 30 }, { wch: 20 }, { wch: 24 }, { wch: 20 },
    { wch: 28 }, { wch: 30 }, { wch: 28 }, { wch: 28 },
    { wch: 20 }, { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Transacciones");

  download(wb, `transacciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Analíticas / Ingresos ─────────────────────────────────────────────────────
export function exportAnalyticsExcel(breakdown: any, months: any[]) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Estado de resultados
  const pnl = [
    { "Concepto": "INGRESOS", "Valor (COP)": "" },
    { "Concepto": "  Suscripciones barberos", "Valor (COP)": breakdown?.subscriptionRevenue ?? 0 },
    { "Concepto": "  Comisiones 10% de citas", "Valor (COP)": breakdown?.commissionRevenue ?? 0 },
    { "Concepto": "GANANCIA NETA PLATAFORMA", "Valor (COP)": breakdown?.totalPlatformRevenue ?? 0 },
    { "Concepto": "", "Valor (COP)": "" },
    { "Concepto": "MOVIMIENTOS (no son ganancia)", "Valor (COP)": "" },
    { "Concepto": "  Depósitos recibidos por citas (50% + 10%)", "Valor (COP)": breakdown?.grossApptRevenue ?? 0 },
    { "Concepto": "  Pendiente transferir a barberos (50%)", "Valor (COP)": breakdown?.pendingBarberPayouts ?? 0 },
    { "Concepto": "", "Valor (COP)": "" },
    { "Concepto": "ESTADÍSTICAS", "Valor (COP)": "" },
    { "Concepto": "  Suscripciones activas", "Valor (COP)": breakdown?.subscriptionCount ?? 0 },
    { "Concepto": "  Citas pagadas", "Valor (COP)": breakdown?.appointmentCount ?? 0 },
    { "Concepto": "  Citas completadas", "Valor (COP)": breakdown?.completedAppointments ?? 0 },
    { "Concepto": "  Citas canceladas", "Valor (COP)": breakdown?.cancelledAppointments ?? 0 },
    { "Concepto": "  Devoluciones pendientes", "Valor (COP)": breakdown?.pendingRefunds ?? 0 },
    { "Concepto": "  Devoluciones aprobadas", "Valor (COP)": breakdown?.approvedRefunds ?? 0 },
  ];
  const ws1 = XLSX.utils.json_to_sheet(pnl);
  ws1["!cols"] = [{ wch: 48 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Estado de Resultados");

  // Hoja 2: Ingresos por mes
  if (months.length > 0) {
    const monthRows = months.map((m: any) => ({
      "Mes": m.month,
      "Suscripciones (COP)": m.subscriptionRevenue ?? 0,
      "Comisiones Citas (COP)": m.commissionRevenue ?? 0,
      "Ganancia Neta (COP)": m.revenue ?? 0,
      "Nuevos Usuarios": m.newUsers ?? 0,
    }));
    const ws2 = XLSX.utils.json_to_sheet(monthRows);
    ws2["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Ingresos por Mes");
  }

  download(wb, `analiticas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
