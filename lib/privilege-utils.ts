/** Returns a stable, de-duplicated union of role and direct privilege keys. */
export function uniquePrivilegeKeys(rolePrivilegeKeys: string[][], directPrivilegeKeys: string[]) {
  return [...new Set([...rolePrivilegeKeys.flat(), ...directPrivilegeKeys])];
}
