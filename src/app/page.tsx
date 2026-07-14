"use client";

import { useEffect, useState, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import { getDashboardSummary } from "@/actions/dashboard";
import { formatARS } from "@/lib/utils";
import { Wrench, Smartphone, ShoppingCart, TrendingUp, DollarSign, Loader2 } from "lucide-react";

type DashboardData = {
  techServiceTotal: number;
  purchasesTotal: number;
  deviceSalesTotal: number;
  generalSalesTotal: number;
  grandTotal: number;
};

export default function DashboardPage() {
  const { month, year } = useDateStore();
  const [isPending, startTransition] = useTransition();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Dashboard de Comisiones
        </h1>
        {isPending && (
          <div className="flex items-center text-indigo-400 gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            Actualizando...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Servicio Técnico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-indigo-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Servicio Técnico</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatARS.format(data.techServiceTotal)}
          </div>
        </div>

        {/* Card: Compras de Celulares */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-emerald-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Compras</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatARS.format(data.purchasesTotal)}
          </div>
        </div>

        {/* Card: Ventas de Celulares */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-orange-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Ventas Celulares</h3>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatARS.format(data.deviceSalesTotal)}
          </div>
        </div>

        {/* Card: Ventas Generales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-purple-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Ventas Generales</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatARS.format(data.generalSalesTotal)}
          </div>
        </div>
      </div>

      {/* Card: Gran Total */}
      <div className="mt-8 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-900/20">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 p-8 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-indigo-100 font-medium text-lg mb-1 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total de Comisiones
            </h2>
            <p className="text-indigo-200/80 text-sm max-w-sm">
              Suma total de comisiones por Servicio Técnico, Compras y Ventas (Celulares y Generales) del mes de{" "}
              <strong className="text-white">{month}/{year}</strong>.
            </p>
          </div>
          <div className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
            {formatARS.format(data.grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
