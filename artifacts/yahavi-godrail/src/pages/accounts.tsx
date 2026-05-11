import { useListAccounts, getListAccountsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Twitter, Facebook, Instagram, Linkedin, Youtube, Link as LinkIcon, MoreVertical, ShieldCheck, Activity } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function Accounts() {
  const { data: accounts, isLoading } = useListAccounts(
    { workspaceId: 1 },
    { query: { queryKey: getListAccountsQueryKey({ workspaceId: 1 }) } }
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter": return <Twitter className="h-5 w-5 text-sky-500" />;
      case "facebook": return <Facebook className="h-5 w-5 text-blue-600" />;
      case "instagram": return <Instagram className="h-5 w-5 text-pink-600" />;
      case "linkedin": return <Linkedin className="h-5 w-5 text-blue-700" />;
      case "youtube": return <Youtube className="h-5 w-5 text-red-600" />;
      default: return <LinkIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter": return "bg-sky-500/10 text-sky-500";
      case "facebook": return "bg-blue-600/10 text-blue-600";
      case "instagram": return "bg-pink-600/10 text-pink-600";
      case "linkedin": return "bg-blue-700/10 text-blue-700";
      case "youtube": return "bg-red-600/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage the social media accounts connected to this workspace.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Connect Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/20">
                <Skeleton className="h-4 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : accounts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card border-dashed">
          <div className="flex gap-2 mb-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center -mr-4 z-10 border-2 border-background">
              <Twitter className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center z-20 border-2 border-background">
              <Instagram className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center -ml-4 z-10 border-2 border-background">
              <Linkedin className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-medium">No accounts connected</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
            Connect your social media accounts to start scheduling and publishing content.
          </p>
          <Button>Connect your first account</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account) => (
            <Card key={account.id} className="flex flex-col hover-elevate transition-all duration-200">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={account.avatarUrl || undefined} />
                      <AvatarFallback className="text-lg uppercase">{account.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center border-2 border-background shadow-sm ${getPlatformColor(account.platform)}`}>
                      {getPlatformIcon(account.platform)}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-base">{account.displayName}</CardTitle>
                    <CardDescription className="text-sm">@{account.username}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Reconnect</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10">Disconnect</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">{account.followersCount?.toLocaleString() || 0}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Followers</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold">—</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Posts</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 pb-3 border-t bg-muted/10 mt-auto flex justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-500">
                  <ShieldCheck className="h-4 w-4" /> Active connection
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" /> Updated 2h ago
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
