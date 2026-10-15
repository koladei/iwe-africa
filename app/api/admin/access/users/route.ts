import { effectivePrivilegesForUser, privileges, requireAnyPrivilege } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await requireAnyPrivilege([privileges.ACCESS_ASSIGNMENTS_MANAGE, privileges.ACCESS_DIRECT_GRANTS_MANAGE]);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, createdAt: true,
      roleMemberships: { include: { role: { select: { id: true, name: true, slug: true } } } },
      directPrivileges: { include: { privilege: { select: { id: true, key: true, title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({ users: await Promise.all(users.map(async (user) => ({ ...user, effectivePrivileges: [...await effectivePrivilegesForUser(user.id)].sort() }))) });
}
