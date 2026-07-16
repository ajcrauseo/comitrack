"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

export async function getDeviceSales(month: number, year: number) {
  try {
    const record = await prisma.deviceSalesMonthly.findUnique({
      where: { month_year: { month, year } },
    });
    return { success: true, data: record };
  } catch (error) {
    console.error("Error fetching device sales:", error);
    return { success: false, error: "No se pudieron cargar las ventas de equipos." };
  }
}

export async function upsertDeviceSales(
  month: number,
  year: number,
  data: { totalQuantity: number; totalVolume: number }
) {
  try {
    await requireAdmin();
    const record = await prisma.deviceSalesMonthly.upsert({
      where: { month_year: { month, year } },
      update: { totalQuantity: data.totalQuantity, totalVolume: data.totalVolume },
      create: {
        month,
        year,
        totalQuantity: data.totalQuantity,
        totalVolume: data.totalVolume,
      },
    });

    revalidatePath("/ventas-equipos");
    revalidatePath("/ventas-generales");
    revalidatePath("/");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error upserting device sales:", error);
    return { success: false, error: "Error al guardar las ventas de equipos." };
  }
}
