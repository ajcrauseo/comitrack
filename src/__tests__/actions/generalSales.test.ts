import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    generalSalesMonthly: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    deviceSalesMonthly: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getGeneralSales, upsertGeneralSales } from "@/actions/generalSales";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getGeneralSales", () => {
  it("returns general sales and device volume", async () => {
    const record = {
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 500000,
      target: "EXACTLY_100" as const,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const deviceSales = {
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 5,
      totalVolume: 100000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(record);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(deviceSales);

    const result = await getGeneralSales(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.record).toEqual(record);
    expect(result.data?.deviceSalesVolume).toBe(100000);
  });

  it("returns 0 deviceSalesVolume when no device sales exist", async () => {
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(null);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getGeneralSales(1, 2025);

    expect(result.success).toBe(true);
    expect(result.data?.record).toBeNull();
    expect(result.data?.deviceSalesVolume).toBe(0);
  });

  it("returns error on database failure", async () => {
    mockPrisma.generalSalesMonthly.findUnique.mockRejectedValue(new Error("DB error"));

    const result = await getGeneralSales(1, 2025);
    expect(result.success).toBe(false);
  });
});

describe("upsertGeneralSales", () => {
  it("creates a new record", async () => {
    const newRecord = {
      id: "gs-new",
      month: 1,
      year: 2025,
      grossSalesVolume: 300000,
      target: "LESS_THAN_100" as const,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue(newRecord);

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newRecord);
  });

  it("updates an existing record", async () => {
    const updated = {
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 800000,
      target: "GREATER_EQUAL_125" as const,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue(updated);

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 800000,
      target: "GREATER_EQUAL_125",
    });

    expect(result.success).toBe(true);
    expect(result.data?.target).toBe("GREATER_EQUAL_125");
  });

  it("returns error on database failure", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockRejectedValue(new Error("DB error"));

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
    });

    expect(result.success).toBe(false);
  });
});
