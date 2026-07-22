import Link from "next/link";
import type { Metadata } from "next";
import { FileQuestion, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "404 | ComiTrack",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-sm max-w-md w-full">
        <div className="bg-indigo-500/10 p-4 rounded-xl w-fit mx-auto mb-6">
          <FileQuestion className="h-12 w-12 text-indigo-400" />
        </div>

        <h1 className="text-6xl font-extrabold text-slate-50 mb-2">404</h1>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          La página que buscas no existe o fue movida.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm"
        >
          <Home className="h-4 w-4" />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
