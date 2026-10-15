import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizationCatalogue, auditAuthorization, privileges, requirePrivilege } from "@/lib/authorization";

const input = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(3).max(300),
  privilegeKeys: z.array(z.string()).min(1).max(30),
});

async function privilegeIds(keys: string[]) {
  const allowed = new Set(authorizationCatalogue.map((item) => item.key));
  if (keys.some((key) => !allowed.has(key as typeof authorizationCatalogue[number]["key"]))) return null;
  const records = await prisma.privilege.findMany({ where: { key: { in: [...new Set(keys)] } } });
  return records.length === new Set(keys).size ? records.map((record) => record.id) : null;
}

export async function GET() {
  const access = await requirePrivilege(privileges.ACCESS_ROLES_MANAGE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const roles = await prisma.role.findMany({ include: { privileges: { include: { privilege: true } }, _count: { select: { memberships: true } } }, orderBy: { name: "asc" } });
  return Response.json({ roles, privileges: authorizationCatalogue });
}

export async function POST(request: Request) {
  const access = await requirePrivilege(privileges.ACCESS_ROLES_MANAGE);
  if (!access.ok) return Response.json({ error: access.error }, { status: access.status });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Invalid role", details: parsed.error.flatten() }, { status: 400 });
  const ids = await privilegeIds(parsed.data.privilegeKeys);
  if (!ids) return Response.json({ error: "Unknown privilege requested" }, { status: 400 });
  try {
    const role = await prisma.role.create({ data: { ...parsed.data, privileges: { create: ids.map((privilegeId) => ({ privilegeId })) } }, include: { privileges: { include: { privilege: true } } } });
    await auditAuthorization({ actorId: access.user.id, action: "role.created", targetRoleId: role.id, subject: role.slug });
    return Response.json({ role }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return Response.json({ error: "A role already uses that name or slug." }, { status: 409 });
    throw error;
  }
}
