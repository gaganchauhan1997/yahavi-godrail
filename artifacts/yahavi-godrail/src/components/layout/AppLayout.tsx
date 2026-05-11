import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Send,
  CalendarDays,
  Users,
  BarChart3,
  Image as ImageIcon,
  Tags,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetWorkspace } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: workspace } = useGetWorkspace(1, { query: { enabled: true, queryKey: ["workspace", 1] } });

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Posts", href: "/posts", icon: Send },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
    { name: "Accounts", href: "/accounts", icon: Users },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Media", href: "/media", icon: ImageIcon },
    { name: "Labels", href: "/labels", icon: Tags },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "YG";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer p-1 rounded-md hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8 rounded-sm bg-primary/20 text-primary">
                    <AvatarImage src={workspace?.avatarUrl || undefined} />
                    <AvatarFallback className="rounded-sm bg-primary/20 text-primary font-bold">YG</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 text-left">
                    <span className="text-sm font-semibold leading-none">{workspace?.name || "Yahavi Godrail"}</span>
                    <span className="text-xs text-sidebar-foreground/60">Workspace</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-primary rounded-sm flex items-center justify-center text-primary-foreground text-xs font-bold">YG</div>
                    <span>Yahavi Godrail</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Create Workspace...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location === item.href}>
                        <Link href={item.href} className="flex items-center gap-3 py-2 px-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer rounded-md hover:bg-sidebar-accent p-1 transition-colors">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{user?.name || "User"}</span>
                    <span className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ""}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 w-full overflow-hidden">
          <header className="h-14 border-b border-border bg-background flex items-center px-4 shrink-0 lg:hidden">
            <SidebarTrigger />
            <span className="ml-4 font-semibold">Yahavi Godrail</span>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
