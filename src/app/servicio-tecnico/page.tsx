"use client";

import { useState, useEffect, useTransition } from "react";
import { useDateStore } from "@/store/useDateStore";
import {
  getTechnicalServices,
  addTechnicalService,
  deleteTechnicalService,
} from "@/actions/technicalService";
import { ServiceCategory, techRates, serviceLabels } from "@/lib/constants";
import { formatARS } from "@/lib/utils";
import { Wrench, Plus, Trash2, Loader2 } from "lucide-react";

type TechnicalServiceRecord = {
  id: string;
  coders: string;
  date: Date;
  model: string;
  branch: string;
  services: { id: string; serviceType: string }[];
};

export default function ServicioTecnicoPage() {
  const { month, year } = useDateStore();
  const [isPending, startTransition] = useTransition();
  const [records, setRecords] = useState<TechnicalServiceRecord[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [coders, setCoders] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [model, setModel] = useState("");
  const [branch, setBranch] = useState("");
  const [selectedServices, setSelectedServices] = useState<ServiceCategory[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const loadRecords = () => {
    startTransition(() => {
      getTechnicalServices(month, year).then((res) => {
        if (res.success && res.data) {
          // @ts-ignore
          setRecords(res.data);
        }
      });
    });
  };

  useEffect(() => {
    loadRecords();
  }, [month, year]);

  const handleAddService = (category: ServiceCategory) => {
    setSelectedServices([...selectedServices, category]);
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
      services: selectedServices,
    });

    if (res.success) {
      setCoders("");
      setModel("");
      setBranch("");
      setSelectedServices([]);
      loadRecords();
    } else {
      setErrorMsg(res.error || "Ocurrió un error.");
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      const res = await deleteTechnicalService(id);
      if (res.success) {
        loadRecords();
      } else {
        alert(res.error);
      }
    }
  };

  const calculateRecordTotal = (services: { serviceType: string }[]) => {
    return services.reduce((acc, curr) => {
      const rate = techRates[curr.serviceType as ServiceCategory] || 0;
      return acc + rate;
    }, 0);
  };

  const monthTotal = records.reduce((acc, record) => {
    return acc + calculateRecordTotal(record.services);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Wrench className="h-6 w-6 text-blue-400" />
          </div>
          Servicio Técnico
        </h1>
        <div className="text-right">
          <p className="text-sm text-slate-400">Total del Mes</p>
          <p className="text-2xl font-bold text-blue-400">
            {formatARS.format(monthTotal)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO DE INGRESO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-semibold text-white mb-4">Nuevo Registro</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {errorMsg}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">ID (Coders)</label>
                <input
                  type="text"
                  value={coders}
                  onChange={(e) => setCoders(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Modelo de Equipo</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: iPhone 13 Pro Max"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Sucursal</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Centro"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-sm font-medium text-slate-400 mb-2">Añadir Servicio</label>
              <div className="flex gap-2">
                <select
                  id="serviceSelect"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona un servicio...</option>
                  {(Object.keys(serviceLabels) as ServiceCategory[]).map((key) => (
                    <option key={key} value={key}>
                      {serviceLabels[key]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const select = document.getElementById("serviceSelect") as HTMLSelectElement;
                    if (select.value) {
                      handleAddService(select.value as ServiceCategory);
                      select.value = "";
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {selectedServices.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {selectedServices.map((srv, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-md border border-slate-700/50 text-sm">
                      <span className="text-slate-300">{serviceLabels[srv]}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar Registro
            </button>
          </form>
        </div>

        {/* LISTADO DE REGISTROS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Registros del Mes</h2>
            {isPending && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha / Coders</th>
                  <th className="px-4 py-3 font-medium">Equipo / Sucursal</th>
                  <th className="px-4 py-3 font-medium">Servicios</th>
                  <th className="px-4 py-3 font-medium text-right">Comisión</th>
                  <th className="px-4 py-3"></th>
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
                      <tr key={record.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-200">{record.coders}</div>
                          <div className="text-xs">{new Date(record.date).toLocaleDateString("es-AR")}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-300">{record.model}</div>
                          <div className="text-xs">{record.branch}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {record.services.map((s, i) => (
                              <span key={i} className="inline-block px-2 py-1 text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 rounded border border-slate-700 w-fit">
                                {s.serviceType.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-blue-400 text-right">
                          {formatARS.format(recordTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
  );
}
