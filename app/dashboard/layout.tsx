import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getTenantsByUser } from "@/lib/actions/tenant";
import { getActiveTenant } from "@/lib/actions/active-tenant";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has any organizations
  const tenants = await getTenantsByUser();

  if (tenants.length === 0) {
    // First-time user - redirect to onboarding
    redirect("/onboarding");
  }

  // Get active tenant
  const activeTenant = await getActiveTenant();

  return (
    <SidebarProvider>
      <AppSidebar
        user={session.user}
        tenants={tenants}
        activeTenant={activeTenant || tenants[0]}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 px-4 pt-2">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
