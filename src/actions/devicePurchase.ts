"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CapacityKey } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

export async function getDevicePurchases(month: number, year: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  try {
    const purchases = await prisma.devicePurchase.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
    });
    return { success: true, data: purchases };
  } catch (error) {
    console.error("Error fetching device purchases:", error);
    return { success: false, error: "No se pudieron cargar las compras." };
  }
}

export async function addDevicePurchase(data: {
  purchaseOrder: string;
  date: string;
  model: string;
  capacity: CapacityKey;
}) {
  try {
    await requireAdmin();
    const existing = await prisma.devicePurchase.findUnique({
      where: { purchaseOrder: data.purchaseOrder },
    });
    if (existing) {
      return { success: false, error: "La orden de compra ya existe." };
    }

    const purchase = await prisma.devicePurchase.create({
      data: {
        purchaseOrder: data.purchaseOrder,
        date: new Date(data.date),
        model: data.model,
        capacity: data.capacity,
      },
    });

    revalidatePath("/compras");
    revalidatePath("/");
    return { success: true, data: purchase };
  } catch (error) {
    console.error("Error adding device purchase:", error);
    return { success: false, error: "Error al guardar la compra." };
  }
}

export async function deleteDevicePurchase(id: string) {
  try {
    await requireAdmin();
    await prisma.devicePurchase.delete({ where: { id } });
    revalidatePath("/compras");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting device purchase:", error);
    return { success: false, error: "Error al eliminar la compra." };
  }
}

export async function updateDevicePurchase(
  id: string,
  data: {
    purchaseOrder: string;
    date: string;
    model: string;
    capacity: CapacityKey;
  }
) {
  try {
    await requireAdmin();
    const existing = await prisma.devicePurchase.findFirst({
      where: { purchaseOrder: data.purchaseOrder, NOT: { id } },
    });

    if (existing) {
      return { success: false, error: "La orden de compra ya existe en otro registro." };
    }

    const updated = await prisma.devicePurchase.update({
      where: { id },
      data: {
        purchaseOrder: data.purchaseOrder,
        date: new Date(data.date),
        model: data.model,
        capacity: data.capacity,
      },
    });

    revalidatePath("/compras");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating device purchase:", error);
    return { success: false, error: "Error al actualizar la compra." };
  }
}
