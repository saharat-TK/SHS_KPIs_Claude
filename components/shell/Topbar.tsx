"use client";

import { Icon } from "@/components/ui/Icon";
import { Breadcrumb } from "./Breadcrumb";
import { RoleSwitcher } from "./RoleSwitcher";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between gap-md border-b border-hairline bg-surface-lowest/90 backdrop-blur px-lg lg:px-xl">
      <div className="flex items-center gap-md min-w-0">
        <button
          aria-label="Open navigation"
          onClick={onMenu}
          className="lg:hidden text-on-surface rounded p-xs hover:bg-surface-soft"
        >
          <Icon name="menu" size={24} />
        </button>
        <div className="hidden sm:block min-w-0">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <button
          aria-label="Notifications"
          className="relative text-mute hover:text-on-surface rounded p-sm hover:bg-surface-soft transition-colors"
        >
          <Icon name="notifications" size={22} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <RoleSwitcher />
      </div>
    </header>
  );
}
