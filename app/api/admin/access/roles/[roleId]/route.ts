import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationCatalogue, auditAuthorization, hasRoleAssignmentManager, privileges, requirePrivilege } from "@/lib/authorization";

const input = z.object({ name: z.string().trim().min(3).max(80), description: z.string().trim().min(3).max(300), privilegeKeys: z.array(z.string()).min(1).max(30) });

export async function PUT(request: Request, context: { params: Promise<{ roleId: string }> }) {
  const access = await requirePrivilege(privileges.ACCESS_ROLES_MANAGE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const { roleId } = await context.params;
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return Response.json({ error: "Role not found" }, { status: 404 });
  if (role.isBuiltIn) return Response.json({ error: "Built-in roles are protected and cannot be changed." }, { status: 409 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid role", details: parsed.error.flatten() }, { status: 400 });
  const valid = new Set(authorizationCatalogue.map((item) => item.key));
  if (parsed.data.privilegeKeys.some((key) => !valid.has(key as typeof authorizationCatalogue[number]["key"]))) return Response.json({ error: "Unknown privilege requested" }, { status: 400 });
  const records = await prisma.privilege.findMany({ where: { key: { in: [...new Set(parsed.data.privilegeKeys)] } } });
  if (records.length !== new Set(parsed.data.privilegeKeys).size) return Response.json({ error: "Unknown privilege requested" }, { status: 400 });
  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await tx.rolePrivilege.deleteMany({ where: { roleId } });
      const result = await tx.role.update({ where: { id: roleId }, data: { name: parsed.data.name, description: parsed.data.description, privileges: { create: records.map((record) => ({ privilegeId: record.id })) } }, include: { privileges: { include: { privilege: true } } } });
      if (!await hasRoleAssignmentManager(tx)) throw new Error("LAST_ACCESS_MANAGER");
      return result;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACCESS_MANAGER") return Response.json({ error: "At least one user must retain role-assignment access." }, { status: 409 });
    throw error;
  }
  await auditAuthorization({ actorId: access.user.id, action: "role.updated", targetRoleId: roleId, subject: role.slug });
  return Response.json({ role: updated });
}
