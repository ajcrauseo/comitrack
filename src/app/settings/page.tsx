"use client";

import { useState } from "react";
import { useRole } from "@/lib/role-context";
import { updateViewerPin, updateAdminPassword } from "@/actions/auth";
import { Shield, KeyRound, Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";

function PasswordInput({
  id,
  name,
  label,
  placeholder,
  visible,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          required
          autoComplete="off"
          minLength={6}
          className="w-full max-w-xs px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function PinInput({
  id,
  name,
  label,
  visible,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative max-w-xs">
        <input
          type={visible ? "text" : "password"}
          id={id}
          name={name}
          required
          inputMode="numeric"
          maxLength={4}
          className="w-full px-4 py-2.5 pr-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
          placeholder="••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { role } = useRole();
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Lock size={48} className="mb-4 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-300">Acceso restringido</h2>
        <p className="mt-2">Solo los administradores pueden acceder a esta página.</p>
      </div>
    );
  }

  async function handlePinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPinMsg(null);
    setPinLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateViewerPin(formData);
    setPinMsg(res.success ? { type: "success", text: "PIN actualizado correctamente" } : { type: "error", text: res.error! });
    setPinLoading(false);
    if (res.success) {
      (e.target as HTMLFormElement).reset();
      setShowPin(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const newPwd = formData.get("newPassword") as string;
    const confirmPwd = formData.get("confirmPassword") as string;

    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "Las contraseñas nuevas no coinciden" });
      return;
    }

    if (!confirm("¿Estás seguro de que quieres cambiar la contraseña del admin?")) return;

    setPwdMsg(null);
    setPwdLoading(true);
    const res = await updateAdminPassword(formData);
    setPwdMsg(res.success ? { type: "success", text: "Contraseña actualizada correctamente" } : { type: "error", text: res.error! });
    setPwdLoading(false);
    if (res.success) {
      form.reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Configuración</h1>
        <p className="text-slate-400 mt-1">Administra las credenciales de tu cuenta</p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-500/20 p-2.5 rounded-lg">
            <Eye className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-50">PIN de Viewer</h2>
            <p className="text-sm text-slate-400">Actualiza el PIN numérico de 4 dígitos para el acceso de solo lectura</p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <PinInput
            id="newPin"
            name="newPin"
            label="Nuevo PIN (4 dígitos)"
            visible={showPin}
            onToggle={() => setShowPin((v) => !v)}
          />

          {pinMsg && (
            <div className={`px-4 py-2.5 rounded-lg text-sm ${
              pinMsg.type === "success"
                ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
                : "bg-red-900/50 border border-red-800 text-red-300"
            }`}>
              {pinMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pinLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <KeyRound size={18} />
            {pinLoading ? "Guardando..." : "Actualizar PIN"}
          </button>
        </form>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500/20 p-2.5 rounded-lg">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-50">Contraseña de Admin</h2>
            <p className="text-sm text-slate-400">Cambia tu contraseña de administrador</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            label="Contraseña actual"
            placeholder="••••••••"
            visible={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
          />

          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="Nueva contraseña"
            placeholder="••••••••"
            visible={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Repetir nueva contraseña"
            placeholder="••••••••"
            visible={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />

          {pwdMsg && (
            <div className={`px-4 py-2.5 rounded-lg text-sm flex items-start gap-2 ${
              pwdMsg.type === "success"
                ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
                : "bg-red-900/50 border border-red-800 text-red-300"
            }`}>
              {pwdMsg.type === "error" && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
              {pwdMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <Lock size={18} />
            {pwdLoading ? "Guardando..." : "Cambiar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
