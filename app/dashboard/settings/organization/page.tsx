import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import OrganizationSettingsClient from "./organization-settings-client";

export default async function OrganizationSettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const activeTenant = await getActiveTenant();

  if (!activeTenant) {
    redirect("/onboarding");
  }

  return <OrganizationSettingsClient tenant={activeTenant} />;
}
