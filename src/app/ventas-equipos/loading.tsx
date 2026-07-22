export default function VentasEquiposLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-52 bg-slate-800 rounded-lg" />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800 rounded-lg" />
          </div>
        </div>
        <div className="h-10 w-32 bg-slate-800 rounded-lg ml-auto" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="h-5 w-40 bg-slate-800 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-slate-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
