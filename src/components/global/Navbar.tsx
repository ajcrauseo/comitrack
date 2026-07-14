"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDateStore } from "@/store/useDateStore";
import { Calculator } from "lucide-react";

export function Navbar() {
  const { month, year, setMonth, setYear } = useDateStore();
  const pathname = usePathname();

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
    { name: "Dashboard", href: "/" },
    { name: "Servicio Técnico", href: "/servicio-tecnico" },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                ComiTrack
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
                      isActive
                        ? "bg-slate-800 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
