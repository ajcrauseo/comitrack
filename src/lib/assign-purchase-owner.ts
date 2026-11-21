import type { PrismaClient } from "@prisma/client";

export async function assignOwnerToOrphanPurchases(
  client: Pick<PrismaClient, "devicePurchase">,
  ownerId: string
) {
  const { count } = await client.devicePurchase.updateMany({
    where: { userId: null },
    data: { userId: ownerId },
  });
  return {
    corrected: count,
    message: count === 0 ? "No había nada para corregir." : undefined,
  };
}

export async function countOrphanPurchases(client: Pick<PrismaClient, "devicePurchase">) {
  return client.devicePurchase.count({ where: { userId: null } });
}
