"use server";

import prisma from "@/lib/prisma";
import {
  techRates,
  calcPurchaseCommission,
  calcDeviceSalesCommission,
  calcGeneralSalesCommission,
  serviceLabels,
  targetLabels,
  targetRates,
  type ServiceCategory,
  type TargetKey,
} from "@/lib/constants";

type TechServiceRecord = {
  coders: string;
  date: Date;
  model: string;
  branch: string;
  services: { serviceType: string; sku?: string | null }[];
  recordTotal: number;
};

type ExportData = {
  month: number;
  year: number;
  grandTotal: number;
  categories: {
    techService: {
      total: number;
      records: TechServiceRecord[];
    };
    purchases: {
      total: number;
      count: number;
      perUnit: number;
    };
    deviceSales: {
      total: number;
      quantity: number;
      volume: number;
      rate: number;
    };
    generalSales: {
      total: number;
      grossVolume: number;
      deviceVolume: number;
      base: number;
      targetLabel: string;
      targetRate: number;
    };
  };
};

export async function getExportData(month: number, year: number) {
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  try {
    const [techServices, purchasesCount, deviceSales, generalSales] =
      await Promise.all([
        prisma.technicalService.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          include: { services: true },
        }),
        prisma.devicePurchase.count({
          where: { date: { gte: startDate, lte: endDate } },
        }),
        prisma.deviceSalesMonthly.findUnique({
          where: { month_year: { month, year } },
        }),
        prisma.generalSalesMonthly.findUnique({
          where: { month_year: { month, year } },
        }),
      ]);

    // ── Servicio Técnico ──
    const techRecords: TechServiceRecord[] = techServices.map((ts) => ({
      coders: ts.coders,
      date: ts.date,
      model: ts.model,
      branch: ts.branch,
      services: ts.services.map((s) => ({
        serviceType: s.serviceType,
        sku: s.sku,
      })),
      recordTotal: ts.services.reduce(
        (sum, s) => sum + (techRates[s.serviceType as ServiceCategory] || 0),
        0
      ),
    }));

    const techTotal = techRecords.reduce((sum, r) => sum + r.recordTotal, 0);

    // ── Compras ──
    const { perUnit: purchasePerUnit, total: purchaseTotal } =
      calcPurchaseCommission(purchasesCount);

    // ── Ventas Equipos ──
    const deviceSalesQuantity = deviceSales?.totalQuantity ?? 0;
    const deviceSalesVolume = deviceSales?.totalVolume ?? 0;
    const deviceSalesTotal = deviceSales
      ? calcDeviceSalesCommission(deviceSalesQuantity, deviceSalesVolume)
      : 0;

    // Calcular tasa efectiva
    let deviceSalesRate = 0;
    if (deviceSalesQuantity > 0) {
      if (deviceSalesQuantity >= 1 && deviceSalesQuantity <= 3)
        deviceSalesRate = 0.005;
      else if (deviceSalesQuantity === 4) deviceSalesRate = 0.008;
      else if (deviceSalesQuantity >= 5 && deviceSalesQuantity <= 9)
        deviceSalesRate = 0.01;
      else deviceSalesRate = 0.016;
    }

    // ── Ventas Generales ──
    let generalSalesTotal = 0;
    let generalSalesBase = 0;
    let generalSalesTargetLabel = "";
    let generalSalesTargetRate = 0;
    const generalGrossVolume = generalSales?.grossSalesVolume ?? 0;
    const generalDeviceVolume = deviceSalesVolume;

    if (generalSales) {
      const { base, commission } = calcGeneralSalesCommission(
        generalGrossVolume,
        generalDeviceVolume,
        generalSales.target
      );
      generalSalesTotal = commission;
      generalSalesBase = base;
      generalSalesTargetLabel =
        targetLabels[generalSales.target as TargetKey] || generalSales.target;
      generalSalesTargetRate =
        targetRates[generalSales.target as TargetKey] || 0;
    }

    const grandTotal =
      techTotal + purchaseTotal + deviceSalesTotal + generalSalesTotal;

    const data: ExportData = {
      month,
      year,
      grandTotal,
      categories: {
        techService: { total: techTotal, records: techRecords },
        purchases: {
          total: purchaseTotal,
          count: purchasesCount,
          perUnit: purchasePerUnit,
        },
        deviceSales: {
          total: deviceSalesTotal,
          quantity: deviceSalesQuantity,
          volume: deviceSalesVolume,
          rate: deviceSalesRate,
        },
        generalSales: {
          total: generalSalesTotal,
          grossVolume: generalGrossVolume,
          deviceVolume: generalDeviceVolume,
          base: generalSalesBase,
          targetLabel: generalSalesTargetLabel,
          targetRate: generalSalesTargetRate,
        },
      },
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching export data:", error);
    return {
      success: false,
      error: "No se pudieron generar los datos del reporte.",
    };
  }
}
