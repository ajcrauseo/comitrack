"use server";

import prisma from "@/lib/prisma";

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

    // ==========================================
    // CÁLCULO 1: Servicio Técnico
    // ==========================================
    let totalTechService = 0;
    const techRates = {
      MODULO_BATERIA_PIN_O_MAYOR_20K: 1500,
      REVISION_APROBADA: 2000,
      LIMPIEZA_O_MENOR_20K: 650,
      DENEGADA_SIN_REPARACION: 0,
    };

    techServices.forEach((ts) => {
      ts.services.forEach((service) => {
        totalTechService += techRates[service.serviceType];
      });
    });

    // ==========================================
    // CÁLCULO 2: Compras de Celulares (Devices)
    // ==========================================
    let totalPurchases = 0;
    if (purchasesCount === 1) totalPurchases = 2000;
    else if (purchasesCount === 2) totalPurchases = 2500 * 2;
    else if (purchasesCount === 3) totalPurchases = 3500 * 3;
    else if (purchasesCount >= 4) totalPurchases = 4500 * purchasesCount;

    // ==========================================
    // CÁLCULO 3: Ventas de Celulares (Devices)
    // ==========================================
    let totalDeviceSales = 0;
    if (deviceSales) {
      const { totalQuantity, totalVolume } = deviceSales;
      let rate = 0;
      if (totalQuantity >= 1 && totalQuantity <= 3) rate = 0.005;
      else if (totalQuantity === 4) rate = 0.008;
      else if (totalQuantity >= 5 && totalQuantity <= 9) rate = 0.01;
      else if (totalQuantity >= 10) rate = 0.016;

      totalDeviceSales = totalVolume * rate;
    }

    // ==========================================
    // CÁLCULO 4: Ventas Generales
    // ==========================================
    let totalGeneralSales = 0;
    if (generalSales) {
      const deviceVolume = deviceSales?.totalVolume || 0;
      const baseVolume = generalSales.grossSalesVolume - deviceVolume;

      const targetRates = {
        LESS_THAN_100: 0.01,     // 1%
        EXACTLY_100: 0.014,      // 1.4%
        EXACTLY_110: 0.016,      // 1.6%
        GREATER_EQUAL_125: 0.018 // 1.8%
      };

      const comissionableBase = Math.max(0, baseVolume);
      totalGeneralSales = comissionableBase * targetRates[generalSales.target];
    }

    // ==========================================
    // RESULTADO FINAL
    // ==========================================
    const grandTotal = totalTechService + totalPurchases + totalDeviceSales + totalGeneralSales;

    return {
      success: true,
      data: {
        techServiceTotal: totalTechService,
        purchasesTotal: totalPurchases,
        deviceSalesTotal: totalDeviceSales,
        generalSalesTotal: totalGeneralSales,
        grandTotal: grandTotal,
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
