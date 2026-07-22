export default function DashboardLoading() {
  return (
    <div className="space-y-5 sm:space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-slate-800 rounded-lg" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-8 bg-slate-800 rounded-lg" />
            </div>
            <div className="h-7 w-28 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600/50 to-purple-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="h-4 w-56 bg-white/10 rounded" />
          </div>
          <div className="h-12 w-48 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}
