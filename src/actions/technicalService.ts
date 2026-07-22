"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ServiceCategory } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth";

export async function getTechnicalServices(month: number, year: number) {
  // Evitamos problemas de Timezone creando las fechas directamente en UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  try {
    const services = await prisma.technicalService.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { services: true },
      orderBy: { date: "desc" },
    });

    return { success: true, data: services };
  } catch (error) {
    console.error("Error fetching technical services:", error);
    return { success: false, error: "No se pudieron cargar los servicios técnicos." };
  }
}

export async function addTechnicalService(data: {
  coders: string;
  date: string;
  model: string;
  branch: string;
  services: { serviceType: ServiceCategory; sku?: string }[];
}) {
  try {
    await requireAdmin();
    // Verificar si el coders ya existe
    const existing = await prisma.technicalService.findUnique({
      where: { coders: data.coders },
    });

    if (existing) {
      return { success: false, error: "El código de reparación (coders) ya existe." };
    }

    // Crear el registro con sus servicios relacionados
    const newService = await prisma.technicalService.create({
      data: {
        coders: data.coders,
        date: new Date(data.date),
        model: data.model,
        branch: data.branch,
        services: {
          create: data.services.map(({ serviceType, sku }) => ({
            serviceType,
            ...(sku ? { sku } : {}),
          })),
        },
      },
      include: { services: true },
    });

    revalidatePath("/servicio-tecnico");
    revalidatePath("/");
    return { success: true, data: newService };
  } catch (error) {
    console.error("Error adding technical service:", error);
    return { success: false, error: "Error al guardar el registro." };
  }
}

export async function updateTechnicalService(
  id: string,
  data: {
    coders: string;
    date: string;
    model: string;
    branch: string;
    services: { serviceType: ServiceCategory; sku?: string }[];
  }
) {
  try {
    await requireAdmin();
    // Verificar unicidad de coders (ignorando el propio registro)
    const existing = await prisma.technicalService.findFirst({
      where: { coders: data.coders, NOT: { id } },
    });

    if (existing) {
      return { success: false, error: "El código de reparación (coders) ya existe en otro registro." };
    }

    // Actualizar campos y reemplazar servicios
    const updated = await prisma.technicalService.update({
      where: { id },
      data: {
        coders: data.coders,
        date: new Date(data.date),
        model: data.model,
        branch: data.branch,
        services: {
          deleteMany: {}, // borra todos los ServiceItems relacionados
          create: data.services.map(({ serviceType, sku }) => ({
            serviceType,
            ...(sku ? { sku } : {}),
          })),
        },
      },
      include: { services: true },
    });

    revalidatePath("/servicio-tecnico");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating technical service:", error);
    return { success: false, error: "Error al actualizar el registro." };
  }
}

export async function deleteTechnicalService(id: string) {
  try {
    await requireAdmin();
    await prisma.technicalService.delete({
      where: { id },
    });
    revalidatePath("/servicio-tecnico");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error deleting technical service:", error);
    return { success: false, error: "Error al eliminar el registro." };
  }
}
