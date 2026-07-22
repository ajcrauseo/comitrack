"use client";

import { useState, useRef, useCallback } from "react";
import { loginAdmin, loginViewer } from "@/actions/auth";
import { LogIn, Eye, ShieldAlert } from "lucide-react";

type Tab = "admin" | "viewer";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  }, []);

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
      <div
        ref={cardRef}
        className="relative w-full max-w-md rounded-2xl p-[1px]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isHovering ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(99,102,241,0.4), rgba(168,85,247,0.3), rgba(236,72,153,0.2), transparent 60%)`,
          }}
        />
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl relative z-10">
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
    </div>
  );
}
