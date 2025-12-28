"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * Layout for flow edit page - hides sidebar for immersive experience
 */
export default function FlowEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setOpen } = useSidebar();

  useEffect(() => {
    // Hide sidebar when entering edit page
    setOpen(false);

    // Also hide the sidebar trigger header by adding a class to body
    document.body.classList.add("flow-detail-page");

    // Cleanup - restore sidebar when leaving edit page
    return () => {
      document.body.classList.remove("flow-detail-page");
      // Restore sidebar to open by default when navigating back
      setOpen(true);
    };
  }, [setOpen]);

  return <>{children}</>;
}
