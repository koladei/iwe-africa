import { z } from "zod";
import { authorizationCatalogue, auditAuthorization, hasRoleAssignmentManager, privileges, requirePrivilege } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const input = z.object({ privilegeKeys: z.array(z.string()).max(30) });

export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await requirePrivilege(privileges.ACCESS_DIRECT_GRANTS_MANAGE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { userId } = await context.params;
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid privilege grants" }, { status: 400 });
  const keys = [...new Set(parsed.data.privilegeKeys)];
  const catalogue = new Set(authorizationCatalogue.map((item) => item.key));
  if (keys.some((key) => !catalogue.has(key as typeof authorizationCatalogue[number]["key"]))) return Response.json({ error: "Unknown privilege requested" }, { status: 400 });
  const [user, records] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), prisma.privilege.findMany({ where: { key: { in: keys } }, select: { id: true, key: true } })]);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  if (records.length !== keys.length) return Response.json({ error: "Unknown privilege requested" }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.userPrivilege.deleteMany({ where: { userId } });
      if (records.length) await tx.userPrivilege.createMany({ data: records.map((record) => ({ userId, privilegeId: record.id, grantedById: access.user.id })) });
      if (!await hasRoleAssignmentManager(tx)) throw new Error("LAST_ACCESS_MANAGER");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACCESS_MANAGER") return Response.json({ error: "At least one user must retain role-assignment access." }, { status: 409 });
    throw error;
  }
  await auditAuthorization({ actorId: access.user.id, action: "user.direct_privileges.replaced", targetUserId: userId, subject: keys.join(",") });
  return Response.json({ grantedPrivilegeKeys: keys });
}
