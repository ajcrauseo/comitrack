"use client";

import { useState, useEffect, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import { useRole } from "@/lib/role-context";
import { getGeneralSales, upsertGeneralSales } from "@/actions/generalSales";
import {
  TargetKey,
  targetLabels,
  targetRates,
  calcGeneralSalesCommission,
} from "@/lib/constants";
import { formatARS } from "@/lib/utils";
import { TrendingUp, Save, Loader2, ArrowRight, Info } from "lucide-react";

const TARGETS: TargetKey[] = ["LESS_THAN_100", "EXACTLY_100", "EXACTLY_110", "GREATER_EQUAL_125"];

export default function VentasGeneralesPage() {
  const { month, year } = useDateStore();
  const { role } = useRole();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [grossVolume, setGrossVolume] = useState("");
  const [target, setTarget] = useState<TargetKey>("LESS_THAN_100");
  const [deviceSalesVolume, setDeviceSalesVolume] = useState(0);

  const gross = parseFloat(grossVolume) || 0;
  const { base, commission } = calcGeneralSalesCommission(gross, deviceSalesVolume, target);

  const loadData = () => {
    startTransition(() => {
      getGeneralSales(month, year).then((res) => {
        if (res.success && res.data) {
          const { record, deviceSalesVolume: dsv } = res.data;
          setDeviceSalesVolume(dsv);
          if (record) {
            setGrossVolume(record.grossSalesVolume.toString());
            setTarget(record.target as TargetKey);
          } else {
            setGrossVolume("");
            setTarget("LESS_THAN_100");
          }
        }
      });
    });
  };

  useEffect(() => { loadData(); }, [month, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grossVolume) {
      setErrorMsg("Ingresa el volumen bruto.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    const res = await upsertGeneralSales(month, year, {
      grossSalesVolume: gross,
      target,
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
          <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg shrink-0">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
          </div>
          Ventas Generales
        </h1>
        {isPending && <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />}
      </div>

      <div className={`grid grid-cols-1 ${role === "ADMIN" ? "lg:grid-cols-2" : ""} gap-5 sm:gap-6`}>
        {/* Form */}
        {role === "ADMIN" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-1">Registro Mensual</h2>
          <p className="text-xs text-slate-500 mb-5">
            Un único registro por mes. Guardarlo sobreescribe el anterior.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg">{successMsg}</div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Volumen de Venta Bruto ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={grossVolume}
                onChange={(e) => setGrossVolume(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Ej: 15000000"
              />
            </div>

            {/* Target radio buttons */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-3">
                Objetivo alcanzado
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TARGETS.map((t) => (
                  <label
                    key={t}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      target === t
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-slate-700 hover:border-slate-600 bg-slate-800/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="target"
                      value={t}
                      checked={target === t}
                      onChange={() => setTarget(t)}
                      className="accent-purple-500"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${ target === t ? "text-purple-300" : "text-slate-300" }`}>
                        {targetLabels[t]}
                      </p>
                      <p className={`text-xs ${ target === t ? "text-purple-400/70" : "text-slate-500" }`}>
                        {(targetRates[t] * 100).toFixed(1)}%
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Registro
            </button>
          </form>
        </div>
        )}

        {/* Breakdown */}
        <div className="space-y-4">
          {/* Commission card */}
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/20 rounded-2xl p-5 sm:p-6">
            <p className="text-xs text-purple-300/70 uppercase tracking-wider font-semibold mb-2">
              Comisión calculada
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-purple-300 tabular-nums">
              {formatARS.format(commission)}
            </p>
            {base > 0 && (
              <p className="text-xs text-purple-400/70 mt-2">
                {(targetRates[target] * 100).toFixed(1)}% sobre base comisionable {formatARS.format(base)}
              </p>
            )}
          </div>

          {/* Calculation breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Desglose del cálculo</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Volumen Bruto</span>
                <span className="text-sm font-medium text-slate-200 tabular-nums">
                  {gross > 0 ? formatARS.format(gross) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">− Vtas. de Equipos</span>
                <span className="text-sm font-medium text-orange-400 tabular-nums">
                  {deviceSalesVolume > 0 ? `− ${formatARS.format(deviceSalesVolume)}` : "—"}
                </span>
              </div>

              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-700" />
                <ArrowRight className="h-3 w-3 text-slate-600" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Base Comisionable</span>
                <span className="text-sm font-semibold text-slate-200 tabular-nums">
                  {gross > 0 ? formatARS.format(base) : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">× Tasa ({targetLabels[target]})</span>
                <span className="text-sm font-medium text-purple-400">
                  {(targetRates[target] * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-700" />
                <ArrowRight className="h-3 w-3 text-slate-600" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Comisión</span>
                <span className="text-base font-bold text-purple-400 tabular-nums">
                  {formatARS.format(commission)}
                </span>
              </div>
            </div>
          </div>

          {deviceSalesVolume === 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                No hay volumen de ventas de equipos registrado para este mes. Completa la pestaña &quot;Vtas. Equipos&quot; primero.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
