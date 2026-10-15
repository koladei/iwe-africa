import { bootstrapAdministrator, ensureAuthorizationCatalogue } from "../lib/authorization";
import { prisma } from "../lib/prisma";

async function main() {
  await ensureAuthorizationCatalogue();
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  await Promise.all(users.map((user) => bootstrapAdministrator(user)));
  console.log(JSON.stringify({ event: "authorization_bootstrap_complete", usersChecked: users.length }));
}

main().finally(() => prisma.$disconnect());
