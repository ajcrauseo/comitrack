"use server";

import prisma from "@/lib/prisma";
import { techRates, calcPurchaseCommission, calcDeviceSalesCommission, calcGeneralSalesCommission } from "@/lib/constants";

export async function getDashboardSummary(month: number, year: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  try {
    const [techServices, purchasesCount, deviceSales, generalSales] = await Promise.all([
      prisma.technicalService.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: { services: true }
      }),
      prisma.devicePurchase.count({
        where: { date: { gte: startDate, lte: endDate } }
      }),
      prisma.deviceSalesMonthly.findUnique({
        where: { month_year: { month, year } }
      }),
      prisma.generalSalesMonthly.findUnique({
        where: { month_year: { month, year } }
      })
    ]);

    const totalTechService = techServices.reduce(
      (sum, ts) => sum + ts.services.reduce((s, service) => s + techRates[service.serviceType], 0),
      0
    );

    const { total: totalPurchases } = calcPurchaseCommission(purchasesCount);

    const totalDeviceSales = deviceSales
      ? calcDeviceSalesCommission(deviceSales.totalQuantity, deviceSales.totalVolume)
      : 0;

    let totalGeneralSales = 0;
    if (generalSales) {
      const deviceVolume = deviceSales?.totalVolume ?? 0;
      const { commission } = calcGeneralSalesCommission(
        generalSales.grossSalesVolume,
        deviceVolume,
        generalSales.target
      );
      totalGeneralSales = commission;
    }

    const grandTotal = totalTechService + totalPurchases + totalDeviceSales + totalGeneralSales;

    return {
      success: true,
      data: {
        techServiceTotal: totalTechService,
        purchasesTotal: totalPurchases,
        deviceSalesTotal: totalDeviceSales,
        generalSalesTotal: totalGeneralSales,
        grandTotal,
      }
    };
  } catch (error) {
    console.error("Error calculating dashboard summary:", error);
    return {
      success: false,
      error: "Hubo un error al calcular los datos del dashboard."
    };
  }
}
