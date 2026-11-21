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

  it("returns the unit goals and units sold stored in the record", async () => {
    const record = {
      id: "gs-1",
      month: 1,
      year: 2025,
      grossSalesVolume: 500000,
      target: "EXACTLY_100" as const,
      unitsMinimum: 100,
      unitsTarget: 150,
      unitsVeryGood: 200,
      unitsSold: 120,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.generalSalesMonthly.findUnique.mockResolvedValue(record);
    mockPrisma.deviceSalesMonthly.findUnique.mockResolvedValue(null);

    const result = await getGeneralSales(1, 2025);

    expect(result.data?.record).toMatchObject({
      unitsMinimum: 100,
      unitsTarget: 150,
      unitsVeryGood: 200,
      unitsSold: 120,
    });
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

  it("saves a new month under the logged-in user", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue({} as never);

    await upsertGeneralSales(1, 2025, { grossSalesVolume: 1000000, target: "LESS_THAN_100" });

    expect(mockPrisma.generalSalesMonthly.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: "test-user-id" }),
      })
    );
  });

  it("editing an existing month does not change its owner", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue({} as never);

    await upsertGeneralSales(1, 2025, { grossSalesVolume: 500000, target: "LESS_THAN_100" });

    const call = mockPrisma.generalSalesMonthly.upsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("userId");
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

  it("passes the unit goals and units sold to both create and update", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue({} as never);

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
      unitsMinimum: 100,
      unitsTarget: 150,
      unitsVeryGood: 200,
      unitsSold: 120,
    });

    expect(result.success).toBe(true);
    const args = mockPrisma.generalSalesMonthly.upsert.mock.calls[0][0];
    const expected = { unitsMinimum: 100, unitsTarget: 150, unitsVeryGood: 200, unitsSold: 120 };
    expect(args.create).toMatchObject(expected);
    expect(args.update).toMatchObject(expected);
  });

  it("persists empty unit fields as null without error", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue({} as never);

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
      unitsMinimum: 100,
      unitsTarget: null,
      unitsSold: 120,
    });

    expect(result.success).toBe(true);
    const args = mockPrisma.generalSalesMonthly.upsert.mock.calls[0][0];
    const expected = { unitsMinimum: 100, unitsTarget: null, unitsVeryGood: null, unitsSold: 120 };
    expect(args.create).toMatchObject(expected);
    expect(args.update).toMatchObject(expected);
  });

  it.each([
    ["minimum > target", { unitsMinimum: 160, unitsTarget: 150, unitsVeryGood: 200 }],
    ["target > veryGood", { unitsMinimum: 100, unitsTarget: 210, unitsVeryGood: 200 }],
  ])("rejects unordered goals (%s) with an error and saves nothing", async (_name, goals) => {
    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
      ...goals,
      unitsSold: 120,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockPrisma.generalSalesMonthly.upsert).not.toHaveBeenCalled();
  });

  it("validates the order only among the goals that are loaded", async () => {
    mockPrisma.generalSalesMonthly.upsert.mockResolvedValue({} as never);
    const base = { grossSalesVolume: 300000, target: "LESS_THAN_100" as const };

    const unordered = await upsertGeneralSales(1, 2025, {
      ...base,
      unitsMinimum: 300,
      unitsTarget: null,
      unitsVeryGood: 200,
    });
    expect(unordered.success).toBe(false);
    expect(mockPrisma.generalSalesMonthly.upsert).not.toHaveBeenCalled();

    const ordered = await upsertGeneralSales(1, 2025, {
      ...base,
      unitsMinimum: 100,
      unitsTarget: null,
      unitsVeryGood: 200,
    });
    expect(ordered.success).toBe(true);
    expect(mockPrisma.generalSalesMonthly.upsert).toHaveBeenCalledTimes(1);
  });

  it("does not save when the user is not an admin", async () => {
    const { cookies } = await import("next/headers");
    const { SignJWT } = await import("jose");
    const viewerToken = await new SignJWT({ userId: "viewer-id", role: "VIEWER" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn((name: string) => {
        if (name === "session") return { value: viewerToken };
        if (name === "role") return { value: "VIEWER" };
        return undefined;
      }),
      set: vi.fn(),
    } as any);

    const result = await upsertGeneralSales(1, 2025, {
      grossSalesVolume: 300000,
      target: "LESS_THAN_100",
      unitsMinimum: 100,
    });

    expect(result.success).toBe(false);
    expect(mockPrisma.generalSalesMonthly.upsert).not.toHaveBeenCalled();
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
