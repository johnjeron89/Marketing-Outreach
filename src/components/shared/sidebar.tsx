"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Mail,
  Target,
  FileText,
  Settings,
  BarChart3,
  ClipboardList,
  Shield,
  ChevronLeft,
  ChevronRight,
  Rocket,
  MessageSquare
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/actions/auth";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: MessageSquare },
  { name: "Investors", href: "/investors", icon: Users },
  { name: "Campaigns", href: "/campaigns", icon: Target },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Audit Log", href: "/audit-log", icon: Shield },
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  if (!isMounted) return null;

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold shadow-lg">
            IO
          </div>
          {!isCollapsed && (
            <span className="truncate font-semibold tracking-tight text-foreground transition-opacity duration-300">
              Investor Outreach
            </span>
          )}
        </div>
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1.5">
          <TooltipProvider delay={0}>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger render={
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  } />
                  {isCollapsed && (
                    <TooltipContent side="right" className="ml-2 font-medium">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      <div className="px-3 py-4 mt-auto">
        <nav className="flex flex-col gap-1.5">
          <TooltipProvider delay={0}>
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger render={
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  } />
                  {isCollapsed && (
                    <TooltipContent side="right" className="ml-2 font-medium">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        <Separator className="my-4 opacity-50" />

        <div className="flex items-center justify-between px-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors flex-1 mr-2 outline-none border-none bg-transparent text-left">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold ring-2 ring-border shrink-0 shadow-sm transition-transform hover:scale-105">
                IO
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium text-foreground">
                    My Profile
                  </span>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" className="cursor-pointer" />}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" className="cursor-pointer" />}>
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => await logout()} 
                className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full hover:bg-muted shrink-0 text-muted-foreground transition-transform",
              isCollapsed && "absolute -right-4 top-1/2 -translate-y-1/2 bg-background border border-border shadow-sm z-50 h-8 w-8 rounded-full"
            )}
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
