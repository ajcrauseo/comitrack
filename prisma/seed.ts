import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const adminUsername = "admin";
  const adminPassword = "admin123";
  const viewerPin = "1234";

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (existing) {
    console.log("Usuario admin ya existe, saltando seed.");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const hashedPin = await bcrypt.hash(viewerPin, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      username: adminUsername,
      adminPassword: hashedPassword,
      viewerPin: hashedPin,
    },
  });

  console.log(`Usuario admin creado:`);
  console.log(`  Username: ${adminUsername}`);
  console.log(`  Admin password: ${adminPassword}`);
  console.log(`  Viewer PIN: ${viewerPin}`);
  console.log("");
  console.log("⚠ CAMBIA estas credenciales después del primer inicio de sesión.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
