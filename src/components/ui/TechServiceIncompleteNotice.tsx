"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useRole } from "@/lib/role-context";

/** Aviso: faltan objetivos o unidades del mes, así que Módulo/Batería/Pin/>20k se paga $1.500 */
export function TechServiceIncompleteNotice({ className }: { className?: string }) {
  const { role } = useRole();

  return (
    <div
      className={`flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl ${className ?? ""}`}
    >
      <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-400">
        Faltan cargar objetivos o unidades de Ventas Generales de este mes. Mientras tanto,
        Módulo/Batería/Pin/&gt;20k se está pagando $1.500.
        {role === "ADMIN" && (
          <>
            {" "}
            <Link href="/ventas-generales" className="underline font-medium hover:text-amber-300">
              Cargar datos
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
