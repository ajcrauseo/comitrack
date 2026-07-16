"use client";

import { useState, useEffect, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import { useRole } from "@/lib/role-context";
import { getDevicePurchases, addDevicePurchase, deleteDevicePurchase, updateDevicePurchase } from "@/actions/devicePurchase";
import {
  IPHONE_MODELS,
  CapacityKey,
  capacityLabels,
  calcPurchaseCommission,
} from "@/lib/constants";
import { formatARS } from "@/lib/utils";
import { ShoppingCart, Plus, Trash2, Loader2, CalendarDays, Package, Pencil, X, Save } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

type Purchase = {
  id: string;
  purchaseOrder: string;
  date: Date;
  model: string;
  capacity: string;
};

const CAPACITIES = Object.entries(capacityLabels) as [CapacityKey, string][];

function CommissionScale({ count }: { count: number }) {
  const tiers = [
    { label: "1 equipo", perUnit: 2000, total: 2000, min: 1, max: 1 },
    { label: "2 equipos", perUnit: 2500, total: 5000, min: 2, max: 2 },
    { label: "3 equipos", perUnit: 3500, total: 10500, min: 3, max: 3 },
    { label: "4+ equipos", perUnit: 4500, total: null, min: 4, max: Infinity },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {tiers.map((tier) => {
        const active = count >= tier.min && count <= tier.max;
        return (
          <div
            key={tier.label}
            className={`rounded-xl p-3 border text-center transition-all ${
              active
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <p className={`text-xs font-medium mb-1 ${
              active ? "text-emerald-400" : "text-slate-500"
            }`}>
              {tier.label}
            </p>
            <p className={`text-sm font-bold ${
              active ? "text-emerald-300" : "text-slate-400"
            }`}>
              {formatARS.format(tier.perUnit)}
            </p>
            <p className={`text-[10px] mt-0.5 ${
              active ? "text-emerald-500" : "text-slate-600"
            }`}>
              por equipo
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function ComprasPage() {
  const { month, year } = useDateStore();
  const { role } = useRole();
  const [isPending, startTransition] = useTransition();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [model, setModel] = useState("");
  const [capacity, setCapacity] = useState<CapacityKey>("GB_128");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit state
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editPurchaseOrder, setEditPurchaseOrder] = useState("");
  const [editDateStr, setEditDateStr] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editCapacity, setEditCapacity] = useState<CapacityKey>("GB_128");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadPurchases = () => {
    startTransition(() => {
      getDevicePurchases(month, year).then((res) => {
        if (res.success && res.data) setPurchases(res.data);
      });
    });
  };

  useEffect(() => { loadPurchases(); }, [month, year]);

  const commission = calcPurchaseCommission(purchases.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrder || !dateStr || !model || !capacity) {
      setErrorMsg("Completa todos los campos.");
      return;
    }
    setErrorMsg("");
    setIsAdding(true);

    const res = await addDevicePurchase({ purchaseOrder, date: dateStr, model, capacity });
    if (res.success) {
      setPurchaseOrder("");
      setModel("");
      setCapacity("GB_128");
      setShowForm(false);
      loadPurchases();
    } else {
      setErrorMsg(res.error || "Error al guardar.");
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta compra?")) {
      const res = await deleteDevicePurchase(id);
      if (res.success) loadPurchases();
      else alert(res.error);
    }
  };

  const openEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    setEditPurchaseOrder(p.purchaseOrder);
    setEditDateStr(new Date(p.date).toISOString().split("T")[0]);
    setEditModel(p.model);
    setEditCapacity(p.capacity as CapacityKey);
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingPurchase(null);
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPurchaseOrder || !editDateStr || !editModel || !editCapacity) {
      setEditError("Completa todos los campos.");
      return;
    }
    if (!editingPurchase) return;
    
    setEditError("");
    setIsSaving(true);

    const res = await updateDevicePurchase(editingPurchase.id, {
      purchaseOrder: editPurchaseOrder,
      date: editDateStr,
      model: editModel,
      capacity: editCapacity,
    });

    if (res.success) {
      closeEditModal();
      loadPurchases();
    } else {
      setEditError(res.error || "Error al actualizar.");
    }
    setIsSaving(false);
  };

  // After adding, commission changes — show updated values
  const nextCommission = calcPurchaseCommission(purchases.length + 1);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg shrink-0">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          Compras
        </h1>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">Comisión del mes</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
            {formatARS.format(commission.total)}
          </p>
        </div>
      </div>

      {/* Commission scale */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
          Escala de comisiones — {purchases.length} equipo{purchases.length !== 1 ? "s" : ""} este mes
        </p>
        <CommissionScale count={purchases.length} />
        {purchases.length > 0 && (
          <p className="mt-3 text-xs text-slate-500 text-center">
            Agregar un equipo más cambiaría la comisión a{" "}
            <span className="text-emerald-400 font-medium">
              {formatARS.format(nextCommission.total)}
            </span>
          </p>
        )}
      </div>

      {/* Mobile toggle */}
      {role === "ADMIN" && (
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="lg:hidden w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
      >
        {showForm ? "Cancelar" : <><Plus className="h-4 w-4" /> Nueva Compra</>}
      </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Form */}
        {role === "ADMIN" && (
        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm h-fit ${
          showForm ? "block" : "hidden lg:block"
        }`}>
          <h2 className="text-lg font-semibold text-white mb-4">Nueva Compra</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Orden de Compra
              </label>
              <input
                type="text"
                value={purchaseOrder}
                onChange={(e) => setPurchaseOrder(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Ej: 1234"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Fecha
              </label>
              <DatePicker value={dateStr} onChange={setDateStr} id="comprasDatePicker" />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Modelo
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                <option value="" disabled>Selecciona un modelo...</option>
                {IPHONE_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                Capacidad
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value as CapacityKey)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              >
                {CAPACITIES.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar Compra
            </button>
          </form>
        </div>
        )}

        {/* Records */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Registros del Mes</h2>
            {isPending && <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />}
          </div>

          {purchases.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay compras registradas este mes.</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {purchases.map((p, idx) => (
                  <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                          <span className="text-sm font-semibold text-slate-200 truncate">{p.purchaseOrder}</span>
                        </div>
                        <p className="text-sm text-slate-300">{p.model}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full">
                            {capacityLabels[p.capacity as CapacityKey]}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(p.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </span>
                        </div>
                      </div>
                      {role === "ADMIN" && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-slate-500 hover:text-blue-400 p-1.5 transition-colors bg-slate-900 rounded-md border border-slate-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 transition-colors bg-slate-900 rounded-md border border-slate-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Orden de Compra</th>
                      <th className="px-4 py-3 font-medium">Modelo</th>
                      <th className="px-4 py-3 font-medium">Capacidad</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      {role === "ADMIN" && <th className="px-4 py-3" />}
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, idx) => (
                      <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-slate-200">{p.purchaseOrder}</td>
                        <td className="px-4 py-3 text-slate-300">{p.model}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {capacityLabels[p.capacity as CapacityKey]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(p.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                        </td>
                        {role === "ADMIN" && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="text-slate-500 hover:text-blue-400 p-1.5 transition-colors rounded-md hover:bg-slate-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-slate-500 hover:text-red-400 p-1.5 transition-colors rounded-md hover:bg-slate-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commission summary footer */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {purchases.length} equipo{purchases.length !== 1 ? "s" : ""} →{" "}
                  <span className="text-emerald-400 font-medium">
                    {formatARS.format(commission.perUnit)} c/u
                  </span>
                </p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">
                  Total: {formatARS.format(commission.total)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editingPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
            style={{ animation: "modalIn 0.2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10 rounded-t-2xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Pencil className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">Editar Compra</h2>
                  <p className="text-xs text-slate-500 font-mono">{editingPurchase.purchaseOrder}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-500 hover:text-slate-300 p-1.5 transition-colors rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Orden de Compra
                </label>
                <input
                  type="text"
                  value={editPurchaseOrder}
                  onChange={(e) => setEditPurchaseOrder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Fecha
                </label>
                <DatePicker value={editDateStr} onChange={setEditDateStr} id="editComprasDatePicker" />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Modelo
                </label>
                <select
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="" disabled>Selecciona un modelo...</option>
                  {IPHONE_MODELS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Capacidad
                </label>
                <select
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value as CapacityKey)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {CAPACITIES.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
