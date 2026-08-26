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
const SEED_TEAMS = ["IT", "Einkauf"];

const SEED_USERS = [
  { email: "admin@test.local", name: "Admin Test", role: Role.ADMIN, password: "Admin123!", team: null },
  { email: "agent@test.local", name: "Agent Test", role: Role.AGENT, password: "Agent123!", team: "IT" },
  { email: "requester@test.local", name: "Requester Test", role: Role.REQUESTER, password: "Requester123!", team: "Einkauf" },
] as const;

async function main() {
  const teamIdByName = new Map<string, string>();

  for (const name of SEED_TEAMS) {
    const team = await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    teamIdByName.set(name, team.id);
  }

  for (const seedUser of SEED_USERS) {
    const teamId = seedUser.team ? teamIdByName.get(seedUser.team) : null;
    const passwordHash = await bcrypt.hash(seedUser.password, 10);

    await prisma.user.upsert({
      where: { email: seedUser.email },
      update: { name: seedUser.name, role: seedUser.role, teamId },
      create: {
        email: seedUser.email,
        name: seedUser.name,
        role: seedUser.role,
        passwordHash,
        teamId,
      },
    });
  }

  console.log(`Seeded ${SEED_TEAMS.length} teams and ${SEED_USERS.length} test users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
