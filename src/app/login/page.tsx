"use client";

import { useState } from "react";
import { loginAdmin, loginViewer } from "@/actions/auth";
import { LogIn, Eye, ShieldAlert } from "lucide-react";

type Tab = "admin" | "viewer";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action = tab === "admin" ? loginAdmin : loginViewer;
    const res = await action(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">ComiTrack</h1>
          <p className="text-slate-400 mt-2">Inicia sesión para continuar</p>
        </div>

        <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => { setTab("admin"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              tab === "admin"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldAlert size={18} />
            Admin
          </button>
          <button
            type="button"
            onClick={() => { setTab("viewer"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              tab === "viewer"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye size={18} />
            Viewer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              autoComplete="username"
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tu nombre de usuario"
            />
          </div>

          {tab === "admin" ? (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-300 mb-1.5">
                PIN (4 dígitos)
              </label>
              <input
                type="password"
                id="pin"
                name="pin"
                required
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <LogIn size={18} />
            {loading ? "Ingresando..." : `Ingresar como ${tab === "admin" ? "Admin" : "Viewer"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
