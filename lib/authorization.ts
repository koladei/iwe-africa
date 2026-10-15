import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/session";
import { uniquePrivilegeKeys } from "@/lib/privilege-utils";
import type { Prisma } from "@prisma/client";

type AuthorizationClient = typeof prisma | Prisma.TransactionClient;

export const privileges = {
  CONFIGURATION_READ: "configuration.read",
  CONFIGURATION_UPDATE: "configuration.update",
  CONTENT_READ: "content.read",
  CONTENT_CREATE: "content.create",
  CONTENT_UPDATE: "content.update",
  CONTENT_PUBLISH: "content.publish",
  CONTENT_ARCHIVE: "content.archive",
  ACCESS_ROLES_MANAGE: "access.roles.manage",
  ACCESS_ASSIGNMENTS_MANAGE: "access.assignments.manage",
  ACCESS_DIRECT_GRANTS_MANAGE: "access.direct-grants.manage",
} as const;

export type PrivilegeKey = (typeof privileges)[keyof typeof privileges];

type PrivilegeDefinition = { key: PrivilegeKey; title: string; description: string };

const privilegeCatalogue: PrivilegeDefinition[] = [
  { key: privileges.CONFIGURATION_READ, title: "View provider settings status", description: "See whether provider settings are configured without revealing their values." },
  { key: privileges.CONFIGURATION_UPDATE, title: "Update provider settings", description: "Replace encrypted OpenAI, Telegram, and WhatsApp configuration values." },
  { key: privileges.CONTENT_READ, title: "View managed content", description: "View lessons in every lifecycle state in the administration area." },
  { key: privileges.CONTENT_CREATE, title: "Create lesson drafts", description: "Create structured lesson drafts." },
  { key: privileges.CONTENT_UPDATE, title: "Edit lesson drafts", description: "Edit drafts and create a revision draft from a published lesson." },
  { key: privileges.CONTENT_PUBLISH, title: "Publish lessons", description: "Publish reviewed lesson drafts." },
  { key: privileges.CONTENT_ARCHIVE, title: "Archive lessons", description: "Archive published lessons without deleting learner history." },
  { key: privileges.ACCESS_ROLES_MANAGE, title: "Manage roles", description: "Create and edit custom roles using the supported privilege catalogue." },
  { key: privileges.ACCESS_ASSIGNMENTS_MANAGE, title: "Manage role assignments", description: "Assign and revoke roles for users." },
  { key: privileges.ACCESS_DIRECT_GRANTS_MANAGE, title: "Manage direct privilege grants", description: "Grant and revoke direct privileges for users." },
];

const roleCatalogue = [
  {
    slug: "platform-administrator",
    name: "Platform Administrator",
    description: "Full Iwe administration access.",
    privileges: privilegeCatalogue.map((item) => item.key),
  },
  {
    slug: "content-editor",
    name: "Content Editor",
    description: "Creates and updates lesson drafts without publishing them.",
    privileges: [privileges.CONTENT_READ, privileges.CONTENT_CREATE, privileges.CONTENT_UPDATE],
  },
  {
    slug: "access-administrator",
    name: "Access Administrator",
    description: "Manages roles, role memberships, and direct privilege grants.",
    privileges: [privileges.ACCESS_ROLES_MANAGE, privileges.ACCESS_ASSIGNMENTS_MANAGE, privileges.ACCESS_DIRECT_GRANTS_MANAGE],
  },
] as const;

function bootstrapEmails() {
  return new Set((process.env.CONFIG_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

/** Idempotently creates the reviewed privilege catalogue and protected built-in roles. */
export async function ensureAuthorizationCatalogue() {
  for (const item of privilegeCatalogue) {
    await prisma.privilege.upsert({
      where: { key: item.key },
      update: { title: item.title, description: item.description },
      create: item,
    });
  }

  const storedPrivileges = await prisma.privilege.findMany({ select: { id: true, key: true } });
  const privilegeIds = new Map(storedPrivileges.map((item) => [item.key, item.id]));

  for (const role of roleCatalogue) {
    const storedRole = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description, isBuiltIn: true },
      create: { slug: role.slug, name: role.name, description: role.description, isBuiltIn: true },
    });
    for (const privilege of role.privileges) {
      const privilegeId = privilegeIds.get(privilege);
      if (!privilegeId) throw new Error(`Missing seeded privilege: ${privilege}`);
      await prisma.rolePrivilege.upsert({
        where: { roleId_privilegeId: { roleId: storedRole.id, privilegeId } },
        update: {},
        create: { roleId: storedRole.id, privilegeId },
      });
    }
  }
}

/** Promotes only configured bootstrap accounts; it never demotes an existing assignment. */
export async function bootstrapAdministrator(user: { id: string; email: string }) {
  if (!bootstrapEmails().has(user.email.toLowerCase())) return;
  await ensureAuthorizationCatalogue();
  const administrator = await prisma.role.findUniqueOrThrow({ where: { slug: "platform-administrator" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: administrator.id } },
    update: {},
    create: { userId: user.id, roleId: administrator.id },
  });
}

export async function effectivePrivilegesForUser(userId: string, database: AuthorizationClient = prisma) {
  const user = await database.user.findUnique({
    where: { id: userId },
    include: {
      roleMemberships: { include: { role: { include: { privileges: { include: { privilege: true } } } } } },
      directPrivileges: { include: { privilege: true } },
    },
  });
  if (!user) return new Set<string>();
  return new Set(uniquePrivilegeKeys(
    user.roleMemberships.map((membership) => membership.role.privileges.map((grant) => grant.privilege.key)),
    user.directPrivileges.map((grant) => grant.privilege.key),
  ));
}


export async function currentUserWithPrivileges() {
  const user = await currentUser();
  if (!user) return null;
  await bootstrapAdministrator(user);
  return { user, privileges: await effectivePrivilegesForUser(user.id) };
}

export async function requirePrivilege(privilege: PrivilegeKey) {
  const context = await currentUserWithPrivileges();
  if (!context) return { ok: false as const, status: 401, error: "Sign in required" };
  if (!context.privileges.has(privilege)) return { ok: false as const, status: 403, error: "Permission denied" };
  return { ok: true as const, user: context.user, privileges: context.privileges };
}

export async function requireAnyPrivilege(required: PrivilegeKey[]) {
  const context = await currentUserWithPrivileges();
  if (!context) return { ok: false as const, status: 401, error: "Sign in required" };
  if (!required.some((privilege) => context.privileges.has(privilege))) return { ok: false as const, status: 403, error: "Permission denied" };
  return { ok: true as const, user: context.user, privileges: context.privileges };
}

export async function auditAuthorization(input: { actorId: string; action: string; targetUserId?: string; targetRoleId?: string; subject?: string }) {
  await prisma.authorizationAudit.create({ data: input });
}

/** A user who can assign roles can restore administration, so never allow the last one to be removed. */
export async function hasRoleAssignmentManager(database: AuthorizationClient = prisma) {
  const users = await database.user.findMany({ select: { id: true } });
  for (const user of users) {
    const effective = await effectivePrivilegesForUser(user.id, database);
    if (effective.has(privileges.ACCESS_ASSIGNMENTS_MANAGE)) return true;
  }
  return false;
}

export const authorizationCatalogue = privilegeCatalogue;
