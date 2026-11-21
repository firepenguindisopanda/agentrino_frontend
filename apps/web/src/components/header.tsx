"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Gem, LayoutDashboard, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

const NAV = [
  { href: "/", label: "Agents", icon: Bot, match: (p: string) => p === "/" || p.startsWith("/chat") },
  { href: "/oracle", label: "Oracle", icon: Gem, match: (p: string) => p.startsWith("/oracle") },
  { href: "/admin", label: "Admin", icon: LayoutDashboard, match: (p: string) => p.startsWith("/admin") },
] as const;

export default function Header() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Agentrino home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Agentrino</span>
        </Link>

        <nav aria-label="Primary" className="ml-2 flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
