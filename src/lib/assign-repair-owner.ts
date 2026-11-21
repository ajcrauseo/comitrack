import type { PrismaClient } from "@prisma/client";

export async function assignOwnerToOrphanRepairs(
  client: Pick<PrismaClient, "technicalService">,
  ownerId: string
) {
  const { count } = await client.technicalService.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  return {
    corrected: count,
    message: count === 0 ? "No había nada para corregir." : undefined,
  };
}

export async function countOrphanRepairs(client: Pick<PrismaClient, "technicalService">) {
  return client.technicalService.count({ where: { userId: null } });
}
