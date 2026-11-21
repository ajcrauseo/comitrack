// Asigna el dueño a las ventas generales mensuales guardadas sin dueño.
// Uso: npx tsx prisma/assign-general-sales-owner.ts
import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline/promises";
import { assignOwnerToOrphanGeneralSales, countOrphanGeneralSales } from "../src/lib/assign-general-sales-owner";

const prisma = new PrismaClient();

async function confirm(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase() === "s";
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  if (users.length !== 1) {
    console.error(`Se esperaba exactamente 1 usuario y hay ${users.length}. No se toca nada.`);
    process.exitCode = 1;
    return;
  }
  const owner = users[0];

  const pending = await countOrphanGeneralSales(prisma);
  if (pending === 0) {
    console.log("No había nada para corregir.");
    return;
  }

  console.log(`Meses de ventas generales sin dueño: ${pending}`);
  console.log(`Se asignarán al usuario "${owner.username}" (${owner.id}).`);
  if (!(await confirm("¿Aplicar? (s/N): "))) {
    console.log("Cancelado. No se modificó nada.");
    return;
  }

  const result = await assignOwnerToOrphanGeneralSales(prisma, owner.id);
  const remaining = await countOrphanGeneralSales(prisma);
  console.log(`Corregidas: ${result.corrected}. Quedan sin dueño: ${remaining}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
