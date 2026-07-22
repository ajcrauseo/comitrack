import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    technicalService: {
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
  getTechnicalServices,
  addTechnicalService,
  updateTechnicalService,
  deleteTechnicalService,
} from "@/actions/technicalService";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTechnicalServices", () => {
  it("returns services for the given month/year", async () => {
    const services = [
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
        ],
      },
    ];
    mockPrisma.technicalService.findMany.mockResolvedValue(services);

    const result = await getTechnicalServices(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].services).toHaveLength(1);
  });

  it("returns empty array when no services exist", async () => {
    mockPrisma.technicalService.findMany.mockResolvedValue([]);

    const result = await getTechnicalServices(1, 2025);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it("returns error on database failure", async () => {
    mockPrisma.technicalService.findMany.mockRejectedValue(new Error("DB error"));

    const result = await getTechnicalServices(1, 2025);
    expect(result.success).toBe(false);
  });
});

describe("addTechnicalService", () => {
  it("creates a service with items", async () => {
    mockPrisma.technicalService.findUnique.mockResolvedValue(null);
    const newService = {
      id: "ts-new",
      coders: "TS-NEW",
      date: new Date("2025-01-15"),
      model: "iPhone 15",
      branch: "A",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [
        { serviceType: "REVISION_APROBADA" as const, id: "s-new", technicalServiceId: "ts-new", sku: null, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockPrisma.technicalService.create.mockResolvedValue(newService);

    const result = await addTechnicalService({
      coders: "TS-NEW",
      date: "2025-01-15",
      model: "iPhone 15",
      branch: "A",
      services: [{ serviceType: "REVISION_APROBADA" }],
    });

    expect(result.success).toBe(true);
    expect(result.data?.services).toHaveLength(1);
  });

  it("returns error when coders already exists", async () => {
    mockPrisma.technicalService.findUnique.mockResolvedValue({
      id: "existing",
      coders: "TS-DUP",
      date: new Date(),
      model: "iPhone 14",
      branch: "A",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [],
    });

    const result = await addTechnicalService({
      coders: "TS-DUP",
      date: "2025-01-15",
      model: "iPhone 14",
      branch: "A",
      services: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ya existe");
  });

  it("creates service with multiple items", async () => {
    mockPrisma.technicalService.findUnique.mockResolvedValue(null);
    const newService = {
      id: "ts-new",
      coders: "TS-NEW",
      date: new Date("2025-01-15"),
      model: "iPhone 15",
      branch: "A",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [
        { serviceType: "REVISION_APROBADA" as const, id: "s1", technicalServiceId: "ts-new", sku: null, createdAt: new Date(), updatedAt: new Date() },
        { serviceType: "MODULO_BATERIA_PIN_O_MAYOR_20K" as const, id: "s2", technicalServiceId: "ts-new", sku: "SKU-123", createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockPrisma.technicalService.create.mockResolvedValue(newService);

    const result = await addTechnicalService({
      coders: "TS-NEW",
      date: "2025-01-15",
      model: "iPhone 15",
      branch: "A",
      services: [
        { serviceType: "REVISION_APROBADA" },
        { serviceType: "MODULO_BATERIA_PIN_O_MAYOR_20K", sku: "SKU-123" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.services).toHaveLength(2);
  });
});

describe("updateTechnicalService", () => {
  it("updates a service with new items", async () => {
    mockPrisma.technicalService.findFirst.mockResolvedValue(null);
    const updated = {
      id: "ts-1",
      coders: "TS-UPD",
      date: new Date("2025-01-20"),
      model: "iPhone 16",
      branch: "B",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [
        { serviceType: "LIMPIEZA_O_MENOR_20K" as const, id: "s-upd", technicalServiceId: "ts-1", sku: null, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
    mockPrisma.technicalService.update.mockResolvedValue(updated);

    const result = await updateTechnicalService("ts-1", {
      coders: "TS-UPD",
      date: "2025-01-20",
      model: "iPhone 16",
      branch: "B",
      services: [{ serviceType: "LIMPIEZA_O_MENOR_20K" }],
    });

    expect(result.success).toBe(true);
    expect(result.data?.coders).toBe("TS-UPD");
  });

  it("returns error when coders exists in another record", async () => {
    mockPrisma.technicalService.findFirst.mockResolvedValue({
      id: "ts-other",
      coders: "TS-DUP",
      date: new Date(),
      model: "iPhone 14",
      branch: "A",
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      services: [],
    });

    const result = await updateTechnicalService("ts-1", {
      coders: "TS-DUP",
      date: "2025-01-20",
      model: "iPhone 14",
      branch: "A",
      services: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("ya existe");
  });
});

describe("deleteTechnicalService", () => {
  it("deletes a service by id", async () => {
    mockPrisma.technicalService.delete.mockResolvedValue({} as any);

    const result = await deleteTechnicalService("ts-1");
    expect(result.success).toBe(true);
  });

  it("returns error on database failure", async () => {
    mockPrisma.technicalService.delete.mockRejectedValue(new Error("Not found"));

    const result = await deleteTechnicalService("nonexistent");
    expect(result.success).toBe(false);
  });
});
