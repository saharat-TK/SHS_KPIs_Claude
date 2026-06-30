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
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
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
          "fixed inset-y-0 left-0 z-50 w-[234px] shrink-0 border-r border-hairline bg-surface-lowest flex flex-col transition-[transform,width] duration-200 lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:translate-x-0 lg:z-40",
          collapsed ? "lg:w-[72px]" : "lg:w-[234px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "relative flex h-[56px] items-center border-b border-hairline px-md",
            collapsed ? "lg:justify-center lg:px-sm" : "gap-xs",
          )}
        >
          <Link
            href="/"
            onClick={onClose}
            aria-label="Dashboard"
            title={collapsed ? "Health Sciences Analytics Platform" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-xs",
              collapsed && "lg:justify-center",
            )}
          >
            <Image
              src="/shs-logo.png"
              alt="SHS logo"
              width={30}
              height={39}
              priority
              className="h-8 w-auto shrink-0"
            />
            <div className={cn("min-w-0 leading-tight", collapsed && "lg:hidden")}>
              <p className="truncate text-body-strong text-on-surface">Health Sciences</p>
              <p className="truncate text-caption-sm text-mute">Analytics Platform</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT text-mute transition-colors hover:bg-surface-soft hover:text-on-surface lg:flex",
              collapsed && "lg:absolute lg:left-[52px] lg:ml-0 lg:border lg:border-hairline lg:bg-surface-lowest",
            )}
          >
            <Icon name={collapsed ? "chevron_right" : "chevron_left"} size={20} />
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto scroll-thin px-sm py-md flex flex-col gap-md",
            collapsed && "lg:items-center",
          )}
        >
          {NAV.map((group) => {
            const items = group.items.filter(
              (i) => !i.requires || can(i.requires),
            );
            if (items.length === 0) return null;
            return (
              <div
                key={group.label}
                className={cn(
                  "flex flex-col gap-tiny",
                  collapsed && "lg:items-center",
                )}
              >
                <p
                  className={cn(
                    "px-sm text-utility-xs uppercase tracking-wider text-stone mb-xs",
                    collapsed && "lg:hidden",
                  )}
                >
                  {group.label}
                </p>
                {items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-xs rounded-DEFAULT px-sm py-xs text-label-sm transition-colors",
                        collapsed && "lg:h-10 lg:w-10 lg:justify-center lg:p-0",
                        active
                          ? "bg-surface-soft text-primary-dark border border-primary-container"
                          : "text-on-surface border border-transparent hover:bg-surface-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT",
                          active ? "bg-primary-container/20" : "text-mute",
                        )}
                      >
                        <Icon name={item.icon} size={19} />
                      </span>
                      <span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "truncate border-t border-hairline px-md py-sm text-caption-sm text-mute",
            collapsed && "lg:px-sm lg:text-center",
          )}
          title="MFU · School of Health Sciences"
        >
          <span className={cn(collapsed && "lg:hidden")}>
            MFU · School of Health Sciences
          </span>
          <span className={cn("hidden", collapsed && "lg:inline")}>MFU</span>
        </div>
      </aside>
    </>
  );
}
