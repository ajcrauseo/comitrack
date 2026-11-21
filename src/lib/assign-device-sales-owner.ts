import type { PrismaClient } from "@prisma/client";

export async function assignOwnerToOrphanDeviceSales(
  client: Pick<PrismaClient, "deviceSalesMonthly">,
  ownerId: string
) {
  const { count } = await client.deviceSalesMonthly.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  return {
    corrected: count,
    message: count === 0 ? "No había nada para corregir." : undefined,
  };
}

export async function countOrphanDeviceSales(client: Pick<PrismaClient, "deviceSalesMonthly">) {
  return client.deviceSalesMonthly.count({ where: { userId: null } });
}
