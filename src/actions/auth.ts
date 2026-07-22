"use server";

import prisma from "@/lib/prisma";
import { verifyPassword, hashPassword, setSessionCookie, clearSessionCookie, validatePin, getSession } from "@/lib/auth";
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "@/lib/rate-limit";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAdmin(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { success: false, error: "Usuario y contraseña son requeridos" };
  }

  const { allowed, retryAfterMs } = checkRateLimit(`login:${username}`);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return { success: false, error: `Demasiados intentos. Probá de nuevo en ${minutes} minuto${minutes > 1 ? "s" : ""}.` };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    recordFailedAttempt(`login:${username}`);
    return { success: false, error: "Credenciales inválidas" };
  }

  const valid = await verifyPassword(password, user.adminPassword);
  if (!valid) {
    recordFailedAttempt(`login:${username}`);
    return { success: false, error: "Credenciales inválidas" };
  }

  resetAttempts(`login:${username}`);
  await setSessionCookie({ userId: user.id, role: "ADMIN" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function loginViewer(formData: FormData) {
  const username = formData.get("username") as string;
  const pin = formData.get("pin") as string;

  if (!username || !pin) {
    return { success: false, error: "Usuario y PIN son requeridos" };
  }

  if (!validatePin(pin)) {
    return { success: false, error: "El PIN debe tener exactamente 4 dígitos numéricos" };
  }

  const { allowed, retryAfterMs } = checkRateLimit(`login:${username}`);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return { success: false, error: `Demasiados intentos. Probá de nuevo en ${minutes} minuto${minutes > 1 ? "s" : ""}.` };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    recordFailedAttempt(`login:${username}`);
    return { success: false, error: "Credenciales inválidas" };
  }

  const valid = await verifyPassword(pin, user.viewerPin);
  if (!valid) {
    recordFailedAttempt(`login:${username}`);
    return { success: false, error: "Credenciales inválidas" };
  }

  resetAttempts(`login:${username}`);
  await setSessionCookie({ userId: user.id, role: "VIEWER" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateViewerPin(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "No autorizado" };
  }

  const newPin = formData.get("newPin") as string;
  if (!newPin || !validatePin(newPin)) {
    return { success: false, error: "El PIN debe tener exactamente 4 dígitos numéricos" };
  }

  try {
    const hashedPin = await hashPassword(newPin);
    await prisma.user.update({
      where: { id: session.userId },
      data: { viewerPin: hashedPin },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el PIN" };
  }
}

export async function updateAdminPassword(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { success: false, error: "No autorizado" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "Todos los campos son requeridos" };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Las contraseñas nuevas no coinciden" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return { success: false, error: "Usuario no encontrado" };

    const valid = await verifyPassword(currentPassword, user.adminPassword);
    if (!valid) return { success: false, error: "Contraseña actual incorrecta" };

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { adminPassword: hashedPassword },
    });
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar la contraseña" };
  }
}

export async function getCurrentRole(): Promise<"ADMIN" | "VIEWER" | null> {
  const session = await getSession();
  return session?.role ?? null;
}


