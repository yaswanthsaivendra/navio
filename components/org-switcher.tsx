"use client";

import { useRouter } from "next/navigation";
import { Building2, Check, ChevronRight, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { switchTenant } from "@/lib/actions/active-tenant";
import { useState } from "react";

type Tenant = {
  id: string;
  name: string;
  role: string;
};

type OrgSwitcherProps = {
  tenants: Tenant[];
  activeTenant: Tenant;
};

export function OrgSwitcher({ tenants, activeTenant }: OrgSwitcherProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === activeTenant.id) return;

    setIsLoading(true);
    try {
      await switchTenant(tenantId);
      router.refresh();
    } catch (error) {
      console.error("Failed to switch organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = () => {
    router.push("/onboarding");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          disabled={isLoading}
        >
          <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeTenant.name}</span>
            <span className="text-muted-foreground truncate text-xs capitalize">
              {activeTenant.role.toLowerCase()}
            </span>
          </div>
          <ChevronRight className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Organizations
        </DropdownMenuLabel>
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleSwitch(tenant.id)}
            className="cursor-pointer gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <Building2 className="size-4 shrink-0" />
            </div>
            <div className="font-medium">{tenant.name}</div>
            {tenant.id === activeTenant.id && (
              <Check className="text-primary size-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 p-2"
          onClick={handleCreateOrg}
        >
          <div className="flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
          </div>
          <div className="text-muted-foreground font-medium">
            Create Organization
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
