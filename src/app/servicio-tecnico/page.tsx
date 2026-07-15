"use client";

import { useState, useEffect, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import {
  getTechnicalServices,
  addTechnicalService,
  updateTechnicalService,
  deleteTechnicalService,
} from "@/actions/technicalService";
import { ServiceCategory, techRates, serviceLabels } from "@/lib/constants";
import { formatARS } from "@/lib/utils";
import {
  Wrench,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  X,
  Save,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";

type TechnicalServiceRecord = {
  id: string;
  coders: string;
  date: Date;
  model: string;
  branch: string;
  services: { id: string; serviceType: string; sku?: string | null }[];
};

type SelectedService = {
  serviceType: ServiceCategory;
  sku: string;
};

// ─── ServiceList subcomponent ─────────────────────────────────────────────────
function ServiceList({
  services,
  onRemove,
  onSkuChange,
  selectId,
  onAdd,
}: {
  services: SelectedService[];
  onRemove: (i: number) => void;
  onSkuChange: (i: number, sku: string) => void;
  selectId: string;
  onAdd: (cat: ServiceCategory) => void;
}) {
  return (
    <div className="pt-3 border-t border-slate-800">
      <label className="block text-sm font-medium text-slate-400 mb-2">
        Añadir Servicio
      </label>
      <div className="flex gap-2">
        <select
          id={selectId}
          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Selecciona un servicio...
          </option>
          {(Object.keys(serviceLabels) as ServiceCategory[]).map((key) => (
            <option key={key} value={key}>
              {serviceLabels[key]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const select = document.getElementById(
              selectId
            ) as HTMLSelectElement;
            if (select.value) {
              onAdd(select.value as ServiceCategory);
              select.value = "";
            }
          }}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {services.length > 0 && (
        <ul className="mt-3 space-y-2">
          {services.map((srv, idx) => (
            <li
              key={idx}
              className="flex flex-col gap-2 bg-slate-800/50 p-2.5 rounded-md border border-slate-700/50 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-300 text-xs leading-snug flex-1">
                  {serviceLabels[srv.serviceType]}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="shrink-0 text-slate-500 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                value={srv.sku}
                onChange={(e) => onSkuChange(idx, e.target.value)}
                placeholder="SKU del producto..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Mobile record card ───────────────────────────────────────────────────────
function RecordCard({
  record,
  total,
  onEdit,
  onDelete,
}: {
  record: TechnicalServiceRecord;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-200 text-sm truncate">
            {record.coders}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {new Date(record.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-blue-400">
            {formatARS.format(total)}
          </div>
        </div>
      </div>

      {/* Model + branch */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300">{record.model}</span>
        <span className="text-slate-600">·</span>
        <span>{record.branch}</span>
      </div>

      {/* Services toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        {record.services.length} servicio{record.services.length !== 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-1.5">
          {record.services.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="inline-block px-2 py-1 text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 rounded border border-slate-700">
                {s.serviceType.replace(/_/g, " ")}
              </span>
              {s.sku && (
                <span className="inline-block px-2 py-1 text-[10px] font-mono bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                  {s.sku}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <div className="w-px h-4 bg-slate-800" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ServicioTecnicoPage() {
  const { month, year } = useDateStore();
  const [isPending, startTransition] = useTransition();
  const [records, setRecords] = useState<TechnicalServiceRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // ── Create form state ──
  const [coders, setCoders] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [model, setModel] = useState("");
  const [branch, setBranch] = useState("");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Edit modal state ──
  const [editingRecord, setEditingRecord] = useState<TechnicalServiceRecord | null>(null);
  const [editCoders, setEditCoders] = useState("");
  const [editDateStr, setEditDateStr] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editServices, setEditServices] = useState<SelectedService[]>([]);
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = () => {
    startTransition(() => {
      getTechnicalServices(month, year).then((res) => {
        if (res.success && res.data) setRecords(res.data);
      });
    });
  };

  useEffect(() => {
    loadRecords();
  }, [month, year]);

  // ── Create handlers ──
  const handleAddService = (category: ServiceCategory) =>
    setSelectedServices([...selectedServices, { serviceType: category, sku: "" }]);

  const handleSkuChange = (index: number, sku: string) => {
    const updated = [...selectedServices];
    updated[index] = { ...updated[index], sku };
    setSelectedServices(updated);
  };

  const handleRemoveService = (index: number) => {
    const updated = [...selectedServices];
    updated.splice(index, 1);
    setSelectedServices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coders || !dateStr || !model || !branch || selectedServices.length === 0) {
      setErrorMsg("Completa todos los campos y añade al menos un servicio.");
      return;
    }
    setErrorMsg("");
    setIsAdding(true);

    const res = await addTechnicalService({
      coders,
      date: dateStr,
      model,
      branch,
      services: selectedServices.map(({ serviceType, sku }) => ({
        serviceType,
        sku: sku.trim() || undefined,
      })),
    });

    if (res.success) {
      setCoders("");
      setModel("");
      setBranch("");
      setSelectedServices([]);
      setShowForm(false);
      loadRecords();
    } else {
      setErrorMsg(res.error || "Ocurrió un error.");
    }
    setIsAdding(false);
  };

  // ── Edit handlers ──
  const openEditModal = (record: TechnicalServiceRecord) => {
    setEditingRecord(record);
    setEditCoders(record.coders);
    setEditDateStr(new Date(record.date).toISOString().split("T")[0]);
    setEditModel(record.model);
    setEditBranch(record.branch);
    setEditServices(
      record.services.map((s) => ({
        serviceType: s.serviceType as ServiceCategory,
        sku: s.sku ?? "",
      }))
    );
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setEditError("");
  };

  const handleEditAddService = (category: ServiceCategory) =>
    setEditServices([...editServices, { serviceType: category, sku: "" }]);

  const handleEditSkuChange = (index: number, sku: string) => {
    const updated = [...editServices];
    updated[index] = { ...updated[index], sku };
    setEditServices(updated);
  };

  const handleEditRemoveService = (index: number) => {
    const updated = [...editServices];
    updated.splice(index, 1);
    setEditServices(updated);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCoders || !editDateStr || !editModel || !editBranch || editServices.length === 0) {
      setEditError("Completa todos los campos y añade al menos un servicio.");
      return;
    }
    if (!editingRecord) return;
    setEditError("");
    setIsSaving(true);

    const res = await updateTechnicalService(editingRecord.id, {
      coders: editCoders,
      date: editDateStr,
      model: editModel,
      branch: editBranch,
      services: editServices.map(({ serviceType, sku }) => ({
        serviceType,
        sku: sku.trim() || undefined,
      })),
    });

    if (res.success) {
      closeEditModal();
      loadRecords();
    } else {
      setEditError(res.error || "Ocurrió un error.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      const res = await deleteTechnicalService(id);
      if (res.success) loadRecords();
      else alert(res.error);
    }
  };

  const calculateRecordTotal = (services: { serviceType: string }[]) =>
    services.reduce((acc, curr) => acc + (techRates[curr.serviceType as ServiceCategory] || 0), 0);

  const monthTotal = records.reduce((acc, r) => acc + calculateRecordTotal(r.services), 0);
  const validRepairsCount = records.filter(r => calculateRecordTotal(r.services) > 0).length;

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
              <Wrench className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            </div>
            <span>Servicio Técnico</span>
          </h1>
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 w-full sm:w-auto shadow-sm">
            <div className="flex-1 sm:flex-none text-left sm:text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1.5">Equipos</p>
              <p className="text-2xl font-bold text-slate-200 tabular-nums leading-none">
                {validRepairsCount}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="flex-1 sm:flex-none text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-1.5">Total</p>
              <p className="text-2xl font-bold text-blue-400 tabular-nums leading-none">
                {formatARS.format(monthTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: collapsible form toggle */}
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="lg:hidden w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancelar" : "Nuevo Registro"}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── CREATE FORM ── */}
          <div
            className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm h-fit ${
              showForm ? "block" : "hidden lg:block"
            }`}
          >
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Nuevo Registro
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                    ID (Coders)
                  </label>
                  <input
                    type="text"
                    value={coders}
                    onChange={(e) => setCoders(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Ej: 123456"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                    Fecha
                  </label>
                  <DatePicker
                    value={dateStr}
                    onChange={setDateStr}
                    id="datePickerCreate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Modelo de Equipo
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ej: iPhone 13 Pro Max"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Sucursal
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ej: FX01"
                />
              </div>

              <ServiceList
                services={selectedServices}
                onRemove={handleRemoveService}
                onSkuChange={handleSkuChange}
                selectId="serviceSelect"
                onAdd={handleAddService}
              />

              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Guardar Registro
              </button>
            </form>
          </div>

          {/* ── RECORDS LIST ── */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                Registros del Mes
              </h2>
              {isPending && (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              )}
            </div>

            {/* Mobile: cards view */}
            <div className="lg:hidden space-y-3">
              {records.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">
                  No hay registros para este mes.
                </p>
              ) : (
                records.map((record) => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    total={calculateRecordTotal(record.services)}
                    onEdit={() => openEditModal(record)}
                    onDelete={() => handleDelete(record.id)}
                  />
                ))
              )}
            </div>

            {/* Desktop: table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha / Coders</th>
                    <th className="px-4 py-3 font-medium">Equipo / Sucursal</th>
                    <th className="px-4 py-3 font-medium">Servicios</th>
                    <th className="px-4 py-3 font-medium text-right">Comisión</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No hay registros para este mes.
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => {
                      const recordTotal = calculateRecordTotal(record.services);
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-200">{record.coders}</div>
                            <div className="text-xs">
                              {new Date(record.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-300">{record.model}</div>
                            <div className="text-xs">{record.branch}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {record.services.map((s, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="inline-block px-2 py-1 text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 rounded border border-slate-700 w-fit">
                                    {s.serviceType.replace(/_/g, " ")}
                                  </span>
                                  {s.sku && (
                                    <span className="inline-block px-2 py-1 text-[10px] font-mono bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 w-fit">
                                      {s.sku}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-blue-400 text-right tabular-nums">
                            {formatARS.format(recordTotal)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(record)}
                                className="text-slate-500 hover:text-blue-400 p-1.5 transition-colors rounded-md hover:bg-slate-800"
                                title="Editar registro"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="text-slate-500 hover:text-red-400 p-1.5 transition-colors rounded-md hover:bg-slate-800"
                                title="Eliminar registro"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
            style={{ animation: "modalIn 0.2s ease-out" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10 rounded-t-2xl sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                  <Pencil className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Editar Registro
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{editingRecord.coders}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-500 hover:text-slate-300 p-1.5 transition-colors rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleEditSubmit} className="p-5 sm:p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                    ID (Coders)
                  </label>
                  <input
                    type="text"
                    value={editCoders}
                    onChange={(e) => setEditCoders(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                    Fecha
                  </label>
                  <DatePicker
                    value={editDateStr}
                    onChange={setEditDateStr}
                    id="datePickerEdit"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Modelo de Equipo
                </label>
                <input
                  type="text"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">
                  Sucursal
                </label>
                <input
                  type="text"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <ServiceList
                services={editServices}
                onRemove={handleEditRemoveService}
                onSkuChange={handleEditSkuChange}
                selectId="editServiceSelect"
                onAdd={handleEditAddService}
              />

              <div className="flex gap-3 pt-1">
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
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
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
    </>
  );
}
