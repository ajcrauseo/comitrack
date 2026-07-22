import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    deviceSalesMonthly: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getDeviceSales, upsertDeviceSales } from "@/actions/deviceSales";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDeviceSales", () => {
  it("returns record for the given month/year", async () => {
    const record = {
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 5,
      totalVolume: 200000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(record);

    const result = await getDeviceSales(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(record);
  });

  it("returns null when no record exists", async () => {
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getDeviceSales(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  it("returns error on database failure", async () => {
    mockPrisma.deviceSalesMonthly.findUnique.mockRejectedValue(new Error("DB error"));

    const result = await getDeviceSales(1, 2025);
    expect(result.success).toBe(false);
  });
});

describe("upsertDeviceSales", () => {
  it("creates a new record", async () => {
    const newRecord = {
      id: "ds-new",
      month: 1,
      year: 2025,
      totalQuantity: 3,
      totalVolume: 150000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.deviceSalesMonthly.upsert.mockResolvedValue(newRecord);

    const result = await upsertDeviceSales(1, 2025, {
      totalQuantity: 3,
      totalVolume: 150000,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newRecord);
  });

  it("updates an existing record", async () => {
    const updated = {
      id: "ds-1",
      month: 1,
      year: 2025,
      totalQuantity: 10,
      totalVolume: 500000,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.deviceSalesMonthly.upsert.mockResolvedValue(updated);

    const result = await upsertDeviceSales(1, 2025, {
      totalQuantity: 10,
      totalVolume: 500000,
    });

    expect(result.success).toBe(true);
    expect(result.data?.totalQuantity).toBe(10);
    expect(result.data?.totalVolume).toBe(500000);
  });

  it("returns error on database failure", async () => {
    mockPrisma.deviceSalesMonthly.upsert.mockRejectedValue(new Error("DB error"));

    const result = await upsertDeviceSales(1, 2025, {
      totalQuantity: 3,
      totalVolume: 150000,
    });

    expect(result.success).toBe(false);
  });
});
