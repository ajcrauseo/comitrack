export default function ServicioTecnicoLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-56 bg-slate-800 rounded-lg" />
        <div className="h-9 w-36 bg-slate-800 rounded-lg" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <div className="h-4 w-48 bg-slate-800 rounded" />
        </div>
        <div className="divide-y divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="h-5 w-24 bg-slate-800 rounded" />
              <div className="h-5 w-32 bg-slate-800 rounded" />
              <div className="h-5 w-20 bg-slate-800 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
