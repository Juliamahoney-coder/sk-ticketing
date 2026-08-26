import "dotenv/config";
import bcrypt from "bcrypt";
import { Role } from "../app/generated/prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Local dev seed users — plaintext test passwords (never real credentials):
 *   admin@test.local     / Admin123!
 *   agent@test.local     / Agent123!
 *   requester@test.local / Requester123!
 */
const SEED_USERS = [
  { email: "admin@test.local", name: "Admin Test", role: Role.ADMIN, password: "Admin123!" },
  { email: "agent@test.local", name: "Agent Test", role: Role.AGENT, password: "Agent123!" },
  { email: "requester@test.local", name: "Requester Test", role: Role.REQUESTER, password: "Requester123!" },
];

async function main() {
  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, 10);

    await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        name: seedUser.name,
        role: seedUser.role,
        passwordHash,
      },
    });
  }

  console.log(`Seeded ${SEED_USERS.length} test users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
