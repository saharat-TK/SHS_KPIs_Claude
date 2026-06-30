"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { NAV } from "./nav";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { can } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] shrink-0 border-r border-hairline bg-surface-lowest flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href="/"
          onClick={onClose}
          className="flex h-[56px] items-center gap-sm px-lg border-b border-hairline"
        >
          <Image
            src="/shs-logo.png"
            alt="SHS logo"
            width={30}
            height={39}
            priority
            className="h-9 w-auto"
          />
          <div className="leading-tight">
            <p className="text-body-strong text-on-surface">Health Sciences</p>
            <p className="text-caption-sm text-mute">Analytics Platform</p>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto scroll-thin px-md py-lg flex flex-col gap-lg">
          {NAV.map((group) => {
            const items = group.items.filter(
              (i) => !i.requires || can(i.requires),
            );
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="flex flex-col gap-tiny">
                <p className="px-md text-utility-xs uppercase tracking-wider text-stone mb-xs">
                  {group.label}
                </p>
                {items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-sm rounded-DEFAULT px-md py-sm text-label-md transition-colors",
                        active
                          ? "bg-surface-soft text-primary-dark border border-primary-container"
                          : "text-on-surface border border-transparent hover:bg-surface-soft",
                      )}
                    >
                      <Icon name={item.icon} size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-hairline px-lg py-md text-caption-sm text-mute">
          MFU · School of Health Sciences
        </div>
      </aside>
    </>
  );
}
