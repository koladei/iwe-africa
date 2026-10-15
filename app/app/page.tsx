import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { Dashboard } from "@/components/dashboard";

export default async function LearnerApp() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return <Dashboard />;
}
