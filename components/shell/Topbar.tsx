"use client";

import { Icon } from "@/components/ui/Icon";
import { Breadcrumb } from "./Breadcrumb";
import { UserMenu } from "./UserMenu";
import { LanguageToggle } from "./LanguageToggle";
import { useT } from "@/lib/i18n/useT";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between gap-md bg-white/90 backdrop-blur px-lg lg:px-xl">
      <div className="flex items-center gap-md min-w-0">
        <button
          aria-label={t("topbar.openNavigation")}
          onClick={onMenu}
          className="lg:hidden text-on-surface rounded p-xs hover:bg-surface-soft transition-colors"
        >
          <Icon name="menu" size={24} />
        </button>
        <div className="hidden sm:block min-w-0 overflow-hidden">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-sm">
        <LanguageToggle />
        <button
          aria-label={t("topbar.notifications")}
          className="relative text-mute hover:text-on-surface rounded p-sm hover:bg-surface-soft transition-colors"
        >
          <Icon name="notifications" size={22} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
