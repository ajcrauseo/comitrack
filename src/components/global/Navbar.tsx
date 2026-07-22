"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDateStore } from "@/store/useDateStore";
import { useRole } from "@/lib/role-context";
import { logout } from "@/actions/auth";
import {
  Calculator,
  Menu,
  X,
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  Settings,
  LogOut,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const years = [2024, 2025, 2026, 2027];

const navLinks = [
  { name: "Dashboard", short: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Servicio Técnico", short: "Técnico", href: "/servicio-tecnico", icon: Wrench },
  { name: "Compras", short: "Compras", href: "/compras", icon: ShoppingCart },
  { name: "Vtas. Equipos", short: "Equipos", href: "/ventas-equipos", icon: Smartphone },
  { name: "Vtas. Generales", short: "Generales", href: "/ventas-generales", icon: TrendingUp },
];

export function Navbar() {
  const { month, year, setMonth, setYear } = useDateStore();
  const { role } = useRole();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    useDateStore.persist.rehydrate();
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  if (pathname === "/login") return null;

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-4 xl:gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="bg-indigo-500 p-1.5 sm:p-2 rounded-lg">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">
                  ComiTrack
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 text-xs xl:text-sm font-medium transition-colors px-2 xl:px-3 py-2 rounded-md whitespace-nowrap ${
                        isActive
                          ? "bg-slate-800 text-indigo-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4 shrink-0" />
                      <span className="hidden xl:inline">{link.name}</span>
                      <span className="xl:hidden">{link.short}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: role badge + selectors + hamburger */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Compact role badge — all sizes */}
              {role === "VIEWER" && (
                <span className="flex items-center gap-1 px-1.5 py-1 rounded-md text-xs text-amber-400/70 bg-amber-400/5 border border-amber-400/10" title="Modo solo lectura">
                  <Eye size={12} />
                  <span className="hidden sm:inline">Solo lectura</span>
                </span>
              )}

              {/* Desktop-only: settings + logout */}
              <div className="hidden lg:flex items-center gap-1 mr-1">
                {role === "ADMIN" && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/50"
                  >
                    <Settings size={14} />
                    <span className="hidden xl:inline">Ajustes</span>
                  </Link>
                )}
                {role && (
                  <button
                    onClick={async () => { await logout(); }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-slate-800/50"
                  >
                    <LogOut size={14} />
                    <span className="hidden xl:inline">Salir</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1 px-1 sm:px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all max-w-[80px] sm:max-w-none"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1 px-1 sm:px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-[58px] sm:w-[68px]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Hamburger — mobile + md */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Abrir menú"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile/tablet drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed top-14 sm:top-16 left-0 right-0 z-40 lg:hidden bg-slate-900 border-b border-slate-800 shadow-xl"
            style={{ animation: "drawerIn 0.2s ease-out" }}
          >
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-slate-800 text-indigo-400"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
                {role === "ADMIN" ? (
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 transition-colors"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    Ajustes
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-amber-400/70">
                    <Eye className="h-4 w-4 shrink-0" />
                    Modo solo lectura
                  </span>
                )}
                <button
                  onClick={async () => { await logout(); }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors ml-auto"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes drawerIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
