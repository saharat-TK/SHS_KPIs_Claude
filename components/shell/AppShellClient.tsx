"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { ImpersonationBanner } from "@/components/shell/ImpersonationBanner";
import { BreadcrumbLabelProvider } from "@/components/shell/BreadcrumbLabels";

const SIDEBAR_COLLAPSED_KEY = "shs-sidebar-collapsed";

/** The dashboard chrome. Split out of app/(app)/layout.tsx when that layout
 *  became a server component so it could resolve the session — this half holds
 *  the interactive state that has to stay on the client. */
export function AppShellClient({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  };

  return (
    <BreadcrumbLabelProvider>
      <div className="flex min-h-screen">
        <Sidebar
          open={navOpen}
          onClose={() => setNavOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setNavOpen(true)} />
          <ImpersonationBanner />
          <main className="flex-1 px-lg lg:px-xl py-lg">
            <div className="mx-auto w-full max-w-canvas flex flex-col gap-lg">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BreadcrumbLabelProvider>
  );
}
