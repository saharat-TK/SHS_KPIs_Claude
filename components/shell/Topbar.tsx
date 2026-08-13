"use client";

import { Icon } from "@/components/ui/Icon";
import { Breadcrumb } from "./Breadcrumb";
import { UserMenu } from "./UserMenu";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between gap-md border-b border-[#151515] bg-black/95 backdrop-blur px-lg lg:px-xl">
      <div className="flex items-center gap-md min-w-0">
        <button
          aria-label="Open navigation"
          onClick={onMenu}
          className="lg:hidden text-white rounded p-xs hover:bg-[#151515]"
        >
          <Icon name="menu" size={24} />
        </button>
        <div className="hidden sm:block min-w-0 overflow-hidden">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <button
          aria-label="Notifications"
          className="relative text-[#8a8a8a] hover:text-white rounded p-sm hover:bg-[#151515] transition-colors"
        >
          <Icon name="notifications" size={22} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
