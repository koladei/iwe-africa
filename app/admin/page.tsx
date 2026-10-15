import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserWithPrivileges, privileges } from "@/lib/authorization";
import { AdminConsole } from "@/components/admin-console";

export default async function AdminPage() {
  const context = await currentUserWithPrivileges();
  if (!context) redirect("/sign-in");
  const effectivePrivileges = [...context.privileges].sort();
  const canAdminister = effectivePrivileges.some((privilege) => Object.values(privileges).includes(privilege as typeof privileges[keyof typeof privileges]));
  if (!canAdminister) return <main className="legal"><Link className="brand" href="/">iwe<span>.</span></Link><p className="eyebrow">ADMINISTRATION</p><h1>Access not granted.</h1><p>Your account does not currently have an Iwe administration privilege.</p></main>;
  return <AdminConsole name={context.user.name} effectivePrivileges={effectivePrivileges} />;
}
