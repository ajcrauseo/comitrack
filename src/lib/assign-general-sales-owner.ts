import type { PrismaClient } from "@prisma/client";

export async function assignOwnerToOrphanGeneralSales(
  client: Pick<PrismaClient, "generalSalesMonthly">,
  ownerId: string
) {
  const { count } = await client.generalSalesMonthly.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  return {
    corrected: count,
    message: count === 0 ? "No había nada para corregir." : undefined,
  };
}

export async function countOrphanGeneralSales(client: Pick<PrismaClient, "generalSalesMonthly">) {
  return client.generalSalesMonthly.count({ where: { userId: null } });
}
