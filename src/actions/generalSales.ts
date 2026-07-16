"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TargetKey } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

export async function getGeneralSales(month: number, year: number) {
  try {
    const [record, deviceSales] = await Promise.all([
      prisma.generalSalesMonthly.findUnique({
        where: { month_year: { month, year } },
      }),
      prisma.deviceSalesMonthly.findUnique({
        where: { month_year: { month, year } },
      }),
    ]);

    return {
      success: true,
      data: {
        record,
        deviceSalesVolume: deviceSales?.totalVolume ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching general sales:", error);
    return { success: false, error: "No se pudieron cargar las ventas generales." };
  }
}

export async function upsertGeneralSales(
  month: number,
  year: number,
  data: { grossSalesVolume: number; target: TargetKey }
) {
  try {
    await requireAdmin();
    const record = await prisma.generalSalesMonthly.upsert({
      where: { month_year: { month, year } },
      update: { grossSalesVolume: data.grossSalesVolume, target: data.target },
      create: {
        month,
        year,
        grossSalesVolume: data.grossSalesVolume,
        target: data.target,
      },
    });

    revalidatePath("/ventas-generales");
    revalidatePath("/");
    return { success: true, data: record };
  } catch (error) {
    console.error("Error upserting general sales:", error);
    return { success: false, error: "Error al guardar las ventas generales." };
  }
}
