"use client";

import { useState, useEffect, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import { useRole } from "@/lib/role-context";
import { getDeviceSales, upsertDeviceSales } from "@/actions/deviceSales";
import { calcDeviceSalesCommission, deviceSalesRateLabels } from "@/lib/constants";
import { formatARS } from "@/lib/utils";
import { Smartphone, Save, Loader2, Info } from "lucide-react";

export default function VentasEquiposPage() {
  const { month, year } = useDateStore();
  const { role } = useRole();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [totalQuantity, setTotalQuantity] = useState("");
  const [totalVolume, setTotalVolume] = useState("");

  const qty = parseInt(totalQuantity) || 0;
  const vol = parseFloat(totalVolume.replace(/[^0-9.]/g, "")) || 0;
  const commission = calcDeviceSalesCommission(qty, vol);

  const activeRate = deviceSalesRateLabels.find((_, i) => {
    if (i === 0 && qty >= 1 && qty <= 3) return true;
    if (i === 1 && qty === 4) return true;
    if (i === 2 && qty >= 5 && qty <= 9) return true;
    if (i === 3 && qty >= 10) return true;
    return false;
  });

  const loadData = () => {
    startTransition(() => {
      getDeviceSales(month, year).then((res) => {
        if (res.success && res.data) {
          setTotalQuantity(res.data.totalQuantity.toString());
          setTotalVolume(res.data.totalVolume.toString());
        } else {
          setTotalQuantity("");
          setTotalVolume("");
        }
      });
    });
  };

  useEffect(() => { loadData(); }, [month, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalQuantity || !totalVolume) {
      setErrorMsg("Completa los dos campos.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    const res = await upsertDeviceSales(month, year, {
      totalQuantity: qty,
      totalVolume: vol,
    });

    if (res.success) {
      setSuccessMsg("Datos guardados correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.error || "Error al guardar.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg shrink-0">
            <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400" />
          </div>
          Ventas de Equipos
        </h1>
        {isPending && <Loader2 className="h-5 w-5 text-orange-400 animate-spin" />}
      </div>

      <div className={`grid grid-cols-1 ${role === "ADMIN" ? "lg:grid-cols-2" : ""} gap-5 sm:gap-6`}>
        {/* Form */}
        {role === "ADMIN" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-1">Registro Mensual</h2>
          <p className="text-xs text-slate-500 mb-5">
            Un único registro por mes. Guardarlo sobreescribe el anterior.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">{successMsg}</div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Cantidad total de equipos vendidos
              </label>
              <input
                type="number"
                min="0"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 5"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Volumen total facturado ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalVolume}
                onChange={(e) => setTotalVolume(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 3500000"
              />
            </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Registro
              </button>
          </form>
        </div>
        )}

        {/* Commission breakdown */}
        <div className="space-y-4">
          {/* Live commission card */}
          <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/20 rounded-2xl p-5 sm:p-6">
            <p className="text-xs text-orange-300/70 uppercase tracking-wider font-semibold mb-2">
              Comisión calculada
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-orange-300 tabular-nums">
              {formatARS.format(commission)}
            </p>
            {qty > 0 && vol > 0 && activeRate && (
              <p className="text-xs text-orange-400/70 mt-2">
                {activeRate.rate} sobre {formatARS.format(vol)} ({qty} equipo{qty !== 1 ? "s" : ""})
              </p>
            )}
          </div>

          {/* Rate table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Escala de tasas</p>
            </div>
            <div className="space-y-2">
              {deviceSalesRateLabels.map(({ qty: qtyLabel, rate }, i) => {
                const active = (
                  (i === 0 && qty >= 1 && qty <= 3) ||
                  (i === 1 && qty === 4) ||
                  (i === 2 && qty >= 5 && qty <= 9) ||
                  (i === 3 && qty >= 10)
                );
                return (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    active ? "bg-orange-500/10 border border-orange-500/20" : "border border-transparent"
                  }`}>
                    <span className={`text-sm ${ active ? "text-orange-300" : "text-slate-400" }`}>{qtyLabel}</span>
                    <span className={`text-sm font-bold tabular-nums ${ active ? "text-orange-300" : "text-slate-500" }`}>{rate}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
