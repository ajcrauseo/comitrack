import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type ServiceCategory =
  | "MODULO_BATERIA_PIN_O_MAYOR_20K"
  | "REVISION_APROBADA"
  | "LIMPIEZA_O_MENOR_20K"
  | "DENEGADA_SIN_REPARACION";

const serviceLabelsShort: Record<ServiceCategory, string> = {
  MODULO_BATERIA_PIN_O_MAYOR_20K: "Módulo/Batería/Pin",
  REVISION_APROBADA: "Revisión Aprobada",
  LIMPIEZA_O_MENOR_20K: "Limpieza",
  DENEGADA_SIN_REPARACION: "Denegada",
};

const serviceRates: Record<ServiceCategory, number> = {
  MODULO_BATERIA_PIN_O_MAYOR_20K: 1500,
  REVISION_APROBADA: 2000,
  LIMPIEZA_O_MENOR_20K: 650,
  DENEGADA_SIN_REPARACION: 0,
};

type ExportData = {
  month: number;
  year: number;
  grandTotal: number;
  categories: {
    techService: {
      total: number;
      records: {
        coders: string;
        date: Date;
        model: string;
        branch: string;
        services: { serviceType: string; sku?: string | null }[];
        recordTotal: number;
      }[];
    };
    purchases: { total: number; count: number; perUnit: number };
    deviceSales: {
      total: number;
      quantity: number;
      volume: number;
      rate: number;
    };
    generalSales: {
      total: number;
      grossVolume: number;
      deviceVolume: number;
      base: number;
      targetLabel: string;
      targetRate: number;
    };
  };
};

const COLORS: Record<string, [number, number, number]> = {
  primary: [55, 48, 163], // indigo
  accent: [139, 92, 246], // violet
  dark: [15, 23, 42], // slate-900
  muted: [100, 116, 139], // slate-500
  white: [255, 255, 255],
  lightBg: [248, 250, 252],
  green: [22, 163, 74],
  orange: [234, 88, 12],
  purple: [147, 51, 234],
  red: [220, 38, 38],
};

function formatARS(value: number): string {
  return "$ " + value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function generateReportPdf(data: ExportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = 20;

  const [r, g, b] = COLORS.dark;

  // ── Helper: new page if needed ──
  function ensureSpace(needed: number) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // ── Helper: section title ──
  function sectionTitle(text: string, color: [number, number, number]) {
    ensureSpace(20);
    y += 4;
    const [cr, cg, cb] = color;
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(margin, y - 4, contentW, 8, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(text, margin + 4, y + 1.5);
    y += 12;
    doc.setTextColor(r, g, b);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PÁGINA 1: HEADER + GRAN TOTAL + RESUMEN
  // ═══════════════════════════════════════════════════════════════════

  // Background decoration
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 46, "F");
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 42, pageW, 4, "F");

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("ComiTrack", margin, 14);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  doc.text(
    `Reporte Mensual — ${monthNames[data.month - 1]} ${data.year}`,
    margin,
    21
  );

  // Gran Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTAL COMISIONES", margin, 32);
  doc.setFontSize(16);
  doc.text(formatARS(data.grandTotal), margin, 40);

  y = 50;

  // Resumen por categoría
  doc.setTextColor(r, g, b);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen por Categoría", margin, y);
  y += 6;

  const summaryRows = [
    [
      "Servicio Técnico",
      formatARS(data.categories.techService.total),
      `${data.categories.techService.records.length} registros`,
    ],
    [
      "Compras de Equipos",
      formatARS(data.categories.purchases.total),
      `${data.categories.purchases.count} equipos`,
    ],
    [
      "Ventas de Celulares",
      formatARS(data.categories.deviceSales.total),
      `${data.categories.deviceSales.quantity} equipos`,
    ],
    [
      "Ventas Generales",
      formatARS(data.categories.generalSales.total),
      data.categories.generalSales.targetLabel
        ? `Obj: ${data.categories.generalSales.targetLabel}`
       : "Sin datos",
    ],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Categoría", "Comisión", "Detalle"]],
    body: summaryRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: r,
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: COLORS.lightBg },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { halign: "right", cellWidth: 45, fontStyle: "bold" },
      2: { halign: "right", cellWidth: 45, textColor: COLORS.muted },
    },
  });

  // @ts-expect-error jspdf-autotable types
  y = doc.lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════════════════
  // SERVICIO TÉCNICO — cada registro
  // ═══════════════════════════════════════════════════════════════════
  sectionTitle("SERVICIO TÉCNICO", COLORS.primary);

  const techRows: string[][] = [];
  for (const record of data.categories.techService.records) {
    for (let i = 0; i < record.services.length; i++) {
      const svc = record.services[i];
      const label =
        serviceLabelsShort[svc.serviceType as ServiceCategory] ||
        svc.serviceType;
      const rate = serviceRates[svc.serviceType as ServiceCategory] || 0;
      const sku = svc.sku ? ` [${svc.sku}]` : "";
      techRows.push([
        i === 0 ? record.coders : "",
        i === 0 ? formatDate(record.date) : "",
        i === 0 ? record.model : "",
        i === 0 ? record.branch : "",
        `${label}${sku}`,
        i === 0 ? formatARS(record.recordTotal) : `${formatARS(rate)}/u`,
      ]);
    }
  }

  if (techRows.length > 0) {
    ensureSpace(30);
    autoTable(doc, {
      startY: y,
      head: [["Coders", "Fecha", "Modelo", "Sucursal", "Servicios", "Comisión"]],
      body: techRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: r,
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: "bold" },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 18 },
        4: { cellWidth: 42 },
        5: { halign: "right", cellWidth: 28, fontStyle: "bold" },
      },
    });

    // @ts-expect-error jspdf-autotable types
    y = doc.lastAutoTable.finalY + 6;
  } else {
    ensureSpace(10);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Sin registros este mes.", margin, y);
    y += 8;
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMPRAS
  // ═══════════════════════════════════════════════════════════════════
  ensureSpace(40);
  sectionTitle("COMPRAS DE EQUIPOS", [16, 185, 129]); // emerald-500

  const { count, perUnit, total } = data.categories.purchases;
  const purchaseRows = [
    ["Equipos comprados", `${count}`],
    ["Comisión por unidad", formatARS(perUnit)],
    ["Comisión total", formatARS(total)],
  ];

  autoTable(doc, {
    startY: y,
    body: purchaseRows,
    margin: { left: margin + 20, right: margin + 60 },
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: r,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [236, 253, 245] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 55, fontStyle: "bold" },
    },
  });

  // @ts-expect-error jspdf-autotable types
  y = doc.lastAutoTable.finalY + 6;

  // ═══════════════════════════════════════════════════════════════════
  // VENTAS DE CELULARES
  // ═══════════════════════════════════════════════════════════════════
  ensureSpace(40);
  sectionTitle("VENTAS DE CELULARES", [234, 88, 12]); // orange-500

  const { quantity, volume, rate: dsRate, total: dsTotal } =
    data.categories.deviceSales;
  const deviceRows = [
    ["Equipos vendidos", `${quantity}`],
    ["Volumen de ventas", formatARS(volume)],
    [
      "Tasa aplicada",
      `${(dsRate * 100).toFixed(1)}%`,
    ],
    ["Comisión total", formatARS(dsTotal)],
  ];

  autoTable(doc, {
    startY: y,
    body: deviceRows,
    margin: { left: margin + 20, right: margin + 60 },
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: r,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 55, fontStyle: "bold" },
    },
  });

  // @ts-expect-error jspdf-autotable types
  y = doc.lastAutoTable.finalY + 6;

  // ═══════════════════════════════════════════════════════════════════
  // VENTAS GENERALES
  // ═══════════════════════════════════════════════════════════════════
  ensureSpace(60);
  sectionTitle("VENTAS GENERALES", [147, 51, 234]); // purple-500

  const gs = data.categories.generalSales;
  const targetDisplay = gs.targetLabel
    ? `${gs.targetLabel} (×${(gs.targetRate * 100).toFixed(1)}%)`
    : "Sin datos";
  const generalRows = [
    ["Volumen bruto de ventas", formatARS(gs.grossVolume)],
    ["Volumen de celulares (resta)", formatARS(gs.deviceVolume)],
    ["Base de cálculo", formatARS(gs.base)],
    ["Objetivo alcanzado", targetDisplay],
    ["Tasa aplicada", gs.targetRate ? `${(gs.targetRate * 100).toFixed(1)}%` : "—"],
    ["Comisión total", formatARS(gs.total)],
  ];

  autoTable(doc, {
    startY: y,
    body: generalRows,
    margin: { left: margin + 20, right: margin + 60 },
    styles: {
      fontSize: 9.5,
      cellPadding: 3,
      textColor: r,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: [245, 243, 255] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { halign: "right", cellWidth: 55, fontStyle: "bold" },
    },
  });

  // ── Footer ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "italic");
    doc.text(
      `ComiTrack — Reporte ${monthNames[data.month - 1]} ${data.year} — Página ${i} de ${pages}`,
      pageW / 2,
      h - 8,
      { align: "center" }
    );
  }

  doc.save(`ComiTrack_${monthNames[data.month - 1]}_${data.year}.pdf`);
}
