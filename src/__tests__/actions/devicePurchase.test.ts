import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    devicePurchase: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import {
  getDevicePurchases,
  addDevicePurchase,
  deleteDevicePurchase,
  updateDevicePurchase,
} from "@/actions/devicePurchase";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDevicePurchases", () => {
  it("returns purchases for the given month/year", async () => {
    const purchases = [
      { id: "p1", purchaseOrder: "OC-001", date: new Date(), model: "iPhone 15", capacity: "GB_256", userId: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockPrisma.devicePurchase.findMany.mockResolvedValue(purchases);

    const result = await getDevicePurchases(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it("returns empty array when no purchases exist", async () => {
    mockPrisma.devicePurchase.findMany.mockResolvedValue([]);

    const result = await getDevicePurchases(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it("returns error on database failure", async () => {
    mockPrisma.devicePurchase.findMany.mockRejectedValue(new Error("DB error"));

    const result = await getDevicePurchases(1, 2025);
    expect(result.success).toBe(false);
  });
});

describe("addDevicePurchase", () => {
  it("creates a new purchase with valid data", async () => {
    mockPrisma.devicePurchase.findUnique.mockResolvedValue(null);
    const newPurchase = {
      id: "p-new",
      purchaseOrder: "OC-NEW",
      date: new Date("2025-01-15"),
      model: "iPhone 15",
      capacity: "GB_256" as const,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.devicePurchase.create.mockResolvedValue(newPurchase);

    const result = await addDevicePurchase({
      purchaseOrder: "OC-NEW",
      date: "2025-01-15",
      model: "iPhone 15",
      capacity: "GB_256",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(newPurchase);
  });

  it("returns error when purchase order already exists", async () => {
    mockPrisma.devicePurchase.findUnique.mockResolvedValue({
      id: "p-existing",
      purchaseOrder: "OC-001",
      date: new Date(),
      model: "iPhone 15",
      capacity: "GB_256",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await addDevicePurchase({
      purchaseOrder: "OC-001",
      date: "2025-01-15",
      model: "iPhone 15",
      capacity: "GB_256",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ya existe");
  });
});

describe("deleteDevicePurchase", () => {
  it("deletes a purchase by id", async () => {
    mockPrisma.devicePurchase.delete.mockResolvedValue({} as any);

    const result = await deleteDevicePurchase("p1");
    expect(result.success).toBe(true);
  });

  it("returns error on database failure", async () => {
    mockPrisma.devicePurchase.delete.mockRejectedValue(new Error("Not found"));

    const result = await deleteDevicePurchase("nonexistent");
    expect(result.success).toBe(false);
  });
});

describe("updateDevicePurchase", () => {
  it("updates a purchase with valid data", async () => {
    mockPrisma.devicePurchase.findFirst.mockResolvedValue(null);
    const updated = {
      id: "p1",
      purchaseOrder: "OC-UPD",
      date: new Date("2025-01-20"),
      model: "iPhone 16",
      capacity: "GB_512" as const,
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrisma.devicePurchase.update.mockResolvedValue(updated);

    const result = await updateDevicePurchase("p1", {
      purchaseOrder: "OC-UPD",
      date: "2025-01-20",
      model: "iPhone 16",
      capacity: "GB_512",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it("returns error when order exists in another record", async () => {
    mockPrisma.devicePurchase.findFirst.mockResolvedValue({
      id: "p-other",
      purchaseOrder: "OC-DUP",
      date: new Date(),
      model: "iPhone 15",
      capacity: "GB_256",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await updateDevicePurchase("p1", {
      purchaseOrder: "OC-DUP",
      date: "2025-01-20",
      model: "iPhone 15",
      capacity: "GB_256",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ya existe");
  });
});
