"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import { Icon } from "@/components/ui/Icon";
import { NAV, type NavItem } from "./nav";

type Can = (action: NonNullable<NavItem["requires"]>) => boolean;

const isPathActive = (pathname: string, href: string, exact?: boolean) =>
  exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

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

  const isVisible = (item: NavItem): boolean => {
    if (item.children) return item.children.some(isVisible);
    return !item.requires || can(item.requires);
  };

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
          "fixed inset-y-0 left-0 z-50 w-[234px] shrink-0 border-r border-[#151515] bg-black flex flex-col transition-[transform,width] duration-200 lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:translate-x-0 lg:z-40",
          collapsed ? "lg:w-[72px]" : "lg:w-[234px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "relative flex h-[56px] items-center border-b border-[#151515] px-md",
            collapsed ? "lg:justify-center lg:px-sm" : "gap-xs",
          )}
        >
          <Link
            href="/dashboard"
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
              <p className="truncate text-body-strong text-white">Health Sciences</p>
              <p className="truncate text-caption-sm text-[#8a8a8a]">Analytics Platform</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT text-[#8a8a8a] transition-colors hover:bg-[#151515] hover:text-white lg:flex",
              collapsed && "lg:absolute lg:left-[52px] lg:ml-0 lg:border lg:border-[#272727] lg:bg-black",
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
            const items = group.items.filter(isVisible);
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
                    "px-sm text-utility-xs uppercase tracking-wider text-[#8a8a8a] mb-xs",
                    collapsed && "lg:hidden",
                  )}
                >
                  {group.label}
                </p>
                {items.map((item) =>
                  item.children ? (
                    <NavParent
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      can={can}
                      collapsed={collapsed}
                      onClose={onClose}
                    />
                  ) : (
                    <NavLeaf
                      key={item.href}
                      item={item}
                      active={isPathActive(pathname, item.href, item.exact)}
                      collapsed={collapsed}
                      onClose={onClose}
                    />
                  ),
                )}
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "truncate border-t border-[#151515] px-md py-sm text-caption-sm text-[#8a8a8a]",
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

function NavLeaf({
  item,
  active,
  collapsed,
  onClose,
  indented,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClose: () => void;
  indented?: boolean;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-xs rounded-DEFAULT border-y border-r border-l-4 px-sm py-xs text-label-sm transition-colors",
        collapsed && "lg:h-10 lg:w-10 lg:justify-center lg:p-0",
        indented && !collapsed && "pl-md",
        active
          ? "border-y-primary border-r-primary border-l-primary-container bg-primary text-white"
          : "border-transparent text-white hover:bg-[#151515]",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT text-white">
        <Icon name={item.icon} size={indented ? 17 : 19} />
      </span>
      <span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>
        {item.label}
      </span>
    </Link>
  );
}

function NavParent({
  item,
  pathname,
  can,
  collapsed,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  can: Can;
  collapsed: boolean;
  onClose: () => void;
}) {
  const children = (item.children ?? []).filter(
    (c) => !c.requires || can(c.requires),
  );
  const childActive = children.some((c) =>
    isPathActive(pathname, c.href, c.exact),
  );
  const [open, setOpen] = useState(childActive);

  // Auto-open when navigating into one of the children.
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // Collapsed rail has no room for a disclosure — show the children as icons.
  if (collapsed) {
    return (
      <>
        {children.map((c) => (
          <NavLeaf
            key={c.href}
            item={c}
            active={isPathActive(pathname, c.href, c.exact)}
            collapsed={collapsed}
            onClose={onClose}
          />
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-tiny">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-xs rounded-DEFAULT border border-transparent px-sm py-xs text-label-sm transition-colors",
          childActive && !open
            ? "text-primary-container"
            : "text-white hover:bg-[#151515]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-DEFAULT",
            childActive ? "text-primary-container" : "text-white",
          )}
        >
          <Icon name={item.icon} size={19} />
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        <Icon
          name={open ? "expand_less" : "expand_more"}
          size={18}
          className="shrink-0 text-[#d8d8d8]"
        />
      </button>
      {open && (
        <div className="flex flex-col gap-tiny">
          {children.map((c) => (
            <NavLeaf
              key={c.href}
              item={c}
              active={isPathActive(pathname, c.href, c.exact)}
              collapsed={collapsed}
              onClose={onClose}
              indented
            />
          ))}
        </div>
      )}
    </div>
  );
}
