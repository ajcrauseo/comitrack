"use client";

import { useEffect, useState, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import { getDashboardSummary } from "@/actions/dashboard";
import { getExportData } from "@/actions/export";
import { formatARS } from "@/lib/utils";
import {
  Wrench,
  Smartphone,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Loader2,
  FileDown,
} from "lucide-react";

type DashboardData = {
  techServiceTotal: number;
  purchasesTotal: number;
  deviceSalesTotal: number;
  generalSalesTotal: number;
  grandTotal: number;
};

const cards = [
  {
    key: "techServiceTotal" as const,
    label: "Servicio Técnico",
    icon: Wrench,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    shadow: "hover:shadow-blue-500/10",
  },
  {
    key: "purchasesTotal" as const,
    label: "Compras",
    icon: ShoppingCart,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    shadow: "hover:shadow-emerald-500/10",
  },
  {
    key: "deviceSalesTotal" as const,
    label: "Ventas Celulares",
    icon: Smartphone,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    shadow: "hover:shadow-orange-500/10",
  },
  {
    key: "generalSalesTotal" as const,
    label: "Ventas Generales",
    icon: TrendingUp,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    shadow: "hover:shadow-purple-500/10",
  },
];

export default function DashboardPage() {
  const { month, year } = useDateStore();
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [data, setData] = useState<DashboardData>({
    techServiceTotal: 0,
    purchasesTotal: 0,
    deviceSalesTotal: 0,
    generalSalesTotal: 0,
    grandTotal: 0,
  });

  useEffect(() => {
    startTransition(() => {
      getDashboardSummary(month, year).then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      });
    });
  }, [month, year]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await getExportData(month, year);
      if (res.success && res.data) {
        const { generateReportPdf } = await import("@/lib/report-pdf");
        generateReportPdf(res.data);
      } else {
        alert(res.error || "Error al generar el reporte.");
      }
    } catch {
      alert("Error al generar el reporte.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
          Dashboard de{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Comisiones
          </span>
        </h1>
        <div className="flex items-center gap-3 shrink-0">
          {isPending && (
            <div className="flex items-center text-indigo-400 gap-1.5 text-xs sm:text-sm font-medium">
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              <span className="hidden sm:inline">Actualizando...</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm border border-slate-700"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Cards grid: 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(({ key, label, icon: Icon, color, bg, shadow }) => (
          <div
            key={key}
            className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm transition-shadow ${shadow}`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-medium text-slate-400 leading-tight">
                {label}
              </h3>
              <div className={`p-1.5 sm:p-2 ${bg} rounded-lg shrink-0`}>
                <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color}`} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tabular-nums">
              {formatARS.format(data[key])}
            </div>
          </div>
        ))}
      </div>

      {/* Grand total card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-indigo-900/20">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-indigo-100 font-semibold text-base sm:text-lg mb-1 flex items-center gap-2">
              <DollarSign className="h-5 w-5 shrink-0" />
              Total de Comisiones
            </h2>
            <p className="text-indigo-200/80 text-xs sm:text-sm leading-relaxed">
              Suma de Servicio Técnico, Compras y Ventas del mes de{" "}
              <strong className="text-white">
                {month}/{year}
              </strong>
              .
            </p>
          </div>
          <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight tabular-nums shrink-0">
            {formatARS.format(data.grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
