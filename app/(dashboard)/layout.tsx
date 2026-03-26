"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  Wrench,
  FileText,
  ScrollText,
  ChevronRight,
  QrCodeIcon,
  Settings2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { LanguageToggle } from "@/components/shared/language-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/assets", labelKey: "nav.assets", icon: Package },
  { href: "/categories", labelKey: "nav.categories", icon: Tags },
  { href: "/attributes", labelKey: "nav.attributes", icon: Settings2Icon },
  { href: "/maintenance", labelKey: "nav.maintenance", icon: Wrench },
  { href: "/invoices", labelKey: "nav.invoices", icon: FileText },
  { href: "/audit-logs", labelKey: "nav.auditLogs", icon: ScrollText },
  { href: "/scan", labelKey: "nav.scan", icon: QrCodeIcon },
];

function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold font-mono">Z</span>
        </div>
        <span className="font-semibold text-foreground">Zoo</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2 h-auto py-2 px-3 rounded-md hover:bg-accent cursor-pointer transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                A
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">
                admin@zoo.local
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("user.myAccount")}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await fetch("/api/auth/sign-out", { method: "POST" });
                window.location.href = "/login";
              }}
            >
              {t("user.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 flex-1 py-2 text-xs transition-colors cursor-pointer",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

const pageConfig: Record<string, { titleKey: string; action?: { label: string; href: string } }> = {
  "/": { titleKey: "page.dashboard" },
  "/assets": { titleKey: "page.assets" },
  "/categories": { titleKey: "page.categories" },
  "/attributes": { titleKey: "page.attributes" },
  "/maintenance": { titleKey: "page.maintenance" },
  "/invoices": { titleKey: "page.invoices" },
  "/audit-logs": { titleKey: "page.auditLogs" },
  "/scan": { titleKey: "page.scan" },
};

function PageHeader() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Match the most specific route
  const config =
    Object.entries(pageConfig)
      .filter(([key]) => (key === "/" ? pathname === "/" : pathname.startsWith(key)))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? { titleKey: "Zoo" };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 border-b bg-background">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">{t(config.titleKey)}</h1>
      </div>
      <div className="flex items-center gap-3">
        {config.action && (
          <Link
            href={config.action.href}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground h-7 gap-1 px-2.5 text-[0.8rem] font-medium hover:bg-primary/80 transition-colors cursor-pointer"
          >
            {config.action.label}
          </Link>
        )}
        <LanguageToggle />
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden pb-16 lg:pb-0">
        <PageHeader />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
