import { z } from "zod";
import { auditAuthorization, hasRoleAssignmentManager, privileges, requirePrivilege } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

const input = z.object({ roleIds: z.array(z.string().min(1)).max(30) });

export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await requirePrivilege(privileges.ACCESS_ASSIGNMENTS_MANAGE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { userId } = await context.params;
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid role assignment" }, { status: 400 });
  const roleIds = [...new Set(parsed.data.roleIds)];
  const [user, roles] = await Promise.all([prisma.user.findUnique({ where: { id: userId } }), prisma.role.findMany({ where: { id: { in: roleIds } }, select: { id: true } })]);
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  if (roles.length !== roleIds.length) return Response.json({ error: "Unknown role requested" }, { status: 400 });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      if (roleIds.length) await tx.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId, grantedById: access.user.id })) });
      if (!await hasRoleAssignmentManager(tx)) throw new Error("LAST_ACCESS_MANAGER");
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACCESS_MANAGER") return Response.json({ error: "At least one user must retain role-assignment access." }, { status: 409 });
    throw error;
  }
  await auditAuthorization({ actorId: access.user.id, action: "user.roles.replaced", targetUserId: userId, subject: roleIds.join(",") });
  return Response.json({ assignedRoleIds: roleIds });
}
