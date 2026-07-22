import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    technicalService: {
      findMany: vi.fn(),
    },
    devicePurchase: {
      count: vi.fn(),
    },
    deviceSalesMonthly: {
      findUnique: vi.fn(),
    },
    generalSalesMonthly: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getDashboardSummary } from "@/actions/dashboard";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDashboardSummary", () => {
  it("returns all zeros when no data exists", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(0);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      techServiceTotal: 0,
      purchasesTotal: 0,
      deviceSalesTotal: 0,
      generalSalesTotal: 0,
      grandTotal: 0,
    });
  });

  it("calculates tech service commissions correctly", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([
      {
        id: "ts-1",
        coders: "TS001",
        date: new Date("2025-01-15"),
        model: "iPhone 14",
        branch: "Sucursal A",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          { serviceType: "REVISION_APROBADA", id: "s1", technicalServiceId: "ts-1", sku: null, createdAt: new Date(), updatedAt: new Date() },
          { serviceType: "MODULO_BATERIA_PIN_O_MAYOR_20K", id: "s2", technicalServiceId: "ts-1", sku: null, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
      {
        id: "ts-2",
        coders: "TS002",
        date: new Date("2025-01-20"),
        model: "iPhone 15",
        branch: "Sucursal B",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          { serviceType: "LIMPIEZA_O_MENOR_20K", id: "s3", technicalServiceId: "ts-2", sku: null, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    ]);
    mockPrisma.devicePurchase.count.mockResolvedValue(0);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.techServiceTotal).toBe(2000 + 1500 + 650);
  });

  it("calculates purchase commissions for 1 purchase", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(1);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.purchasesTotal).toBe(2000);
  });

  it("calculates purchase commissions for 3 purchases", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(3);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.purchasesTotal).toBe(10500);
  });

  it("calculates device sales commissions correctly", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(0);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue({
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 5,
      totalVolume: 200000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.deviceSalesTotal).toBeCloseTo(200000 * 0.01);
  });

  it("calculates general sales commissions correctly", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(0);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue({
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 500000,
      target: "EXACTLY_100",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.generalSalesTotal).toBeCloseTo(500000 * 0.014);
  });

  it("general sales uses device volume for base calculation", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);
    mockPrisma.devicePurchase.count.mockResolvedValue(0);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue({
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 3,
      totalVolume: 100000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue({
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 500000,
      target: "EXACTLY_100",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.generalSalesTotal).toBeCloseTo(400000 * 0.014);
  });

  it("sums all sources into grandTotal", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([
      {
        id: "ts-1",
        coders: "TS001",
        date: new Date("2025-01-15"),
        model: "iPhone 14",
        branch: "A",
        userId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        services: [
          { serviceType: "REVISION_APROBADA", id: "s1", technicalServiceId: "ts-1", sku: null, createdAt: new Date(), updatedAt: new Date() },
        ],
      },
    ]);
    mockPrisma.devicePurchase.count.mockResolvedValue(2);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue({
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 4,
      totalVolume: 100000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue({
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await getDashboardSummary(1, 2025);

    expect(result.success).toBe(true);
    const { techServiceTotal, purchasesTotal, deviceSalesTotal, generalSalesTotal, grandTotal } = result.data!;
    expect(grandTotal).toBe(techServiceTotal + purchasesTotal + deviceSalesTotal + generalSalesTotal);
  });

  it("returns error on database failure", async () => {
    mockPrisma.technicalService.findMany.mockRejectedValue(new Error("DB down"));

    const result = await getDashboardSummary(1, 2025);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
