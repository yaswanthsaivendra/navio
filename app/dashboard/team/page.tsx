import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveTenant } from "@/lib/actions/active-tenant";
import { getMembersByTenant } from "@/lib/actions/membership";
import { getInvitationsByTenant } from "@/lib/actions/invitation";
import TeamClient from "./team-client";

export default async function TeamPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const activeTenant = await getActiveTenant();

  if (!activeTenant) {
    redirect("/onboarding");
  }

  const [members, invitations] = await Promise.all([
    getMembersByTenant(activeTenant.id),
    getInvitationsByTenant(activeTenant.id),
  ]);

  return (
    <TeamClient
      members={members}
      invitations={invitations}
      tenantId={activeTenant.id}
      tenantName={activeTenant.name}
      currentUserRole={activeTenant.role}
    />
  );
}
