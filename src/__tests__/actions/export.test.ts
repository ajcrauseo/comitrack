import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    technicalService: { findMany: vi.fn() },
    devicePurchase: { count: vi.fn() },
    deviceSalesMonthly: { findUnique: vi.fn() },
    generalSalesMonthly: { findUnique: vi.fn() },
  },
}));

import prisma from "@/lib/prisma";
import { getExportData } from "@/actions/export";
import { getDashboardSummary } from "@/actions/dashboard";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

const moduleService = (id: string) => ({
  serviceType: "MODULO_BATERIA_PIN_O_MAYOR_20K" as const,
  id,
  technicalServiceId: "ts-1",
  sku: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

function mockTwoModuleServicesWithVeryGood(month: number, date: string) {
  mockPrisma.technicalService.findMany.mockResolvedValue([
    {
      id: "ts-1",
      coders: "TS001",
      date: new Date(date),
      model: "iPhone 14",
      branch: "Sucursal A",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [moduleService("s1"), moduleService("s2")],
    },
  ]);
  mockPrisma.devicePurchase.count.mockResolvedValue(0);
  mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
  mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue({
    id: "gs-1",
    month,
    year: 2026,
    grossSalesVolume: 0,
    target: "LESS_THAN_100",
    unitsMinimum: 100,
    unitsTarget: 150,
    unitsVeryGood: 200,
    unitsSold: 250,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("getExportData", () => {
  it("muestra en nov/2026 en muy bueno los mismos montos que el dashboard", async () => {
    mockTwoModuleServicesWithVeryGood(11, "2026-11-10");

    const exported = await getExportData(11, 2026);
    const dashboard = await getDashboardSummary(11, 2026);

    const tech = exported.data?.categories.techService;
    expect(tech?.records[0].services.map((s) => s.amount)).toEqual([3500, 3500]);
    expect(tech?.records[0].recordTotal).toBe(7000);
    expect(tech?.total).toBe(7000);
    expect(dashboard.data?.techServiceTotal).toBe(7000);
  });

  it("sigue exportando $1.500 por servicio Módulo/Batería/Pin/>20k en oct/2026 aunque se alcanzó muy bueno", async () => {
    mockTwoModuleServicesWithVeryGood(10, "2026-10-10");

    const exported = await getExportData(10, 2026);

    const tech = exported.data?.categories.techService;
    expect(tech?.records[0].services.map((s) => s.amount)).toEqual([1500, 1500]);
    expect(tech?.records[0].recordTotal).toBe(3000);
    expect(tech?.total).toBe(3000);
  });
});
