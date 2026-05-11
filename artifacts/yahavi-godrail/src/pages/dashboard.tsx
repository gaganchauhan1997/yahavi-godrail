import { useGetDashboardOverview, getGetDashboardOverviewQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Clock, CheckCircle2, Users, AlertCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: overview, isLoading } = useGetDashboardOverview(
    { workspaceId: 1 },
    { query: { queryKey: getGetDashboardOverviewQueryKey({ workspaceId: 1 }) } }
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening with your accounts.</p>
        </div>
        <Button asChild className="shrink-0 font-medium">
          <Link href="/posts">
            <Send className="mr-2 h-4 w-4" /> New Post
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalPosts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.scheduledPosts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Published</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.publishedPosts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Drafts</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.draftPosts || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Posts</CardTitle>
              <CardDescription>Posts scheduled for the next 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/posts">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : overview?.upcomingPosts?.length ? (
              <div className="space-y-6">
                {overview.upcomingPosts.map((post) => (
                  <div key={post.id} className="flex items-start gap-4">
                    <div className="h-10 w-10 shrink-0 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium line-clamp-1">{post.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'No date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No upcoming posts</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">You have nothing scheduled.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/posts">Schedule a post</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Accounts</CardTitle>
              <CardDescription>Accounts with the most activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">
                Manage <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : overview?.topAccounts?.length ? (
              <div className="space-y-6">
                {overview.topAccounts.map((account) => (
                  <div key={account.accountId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center uppercase font-bold text-xs">
                        {account.platform[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{account.username}</span>
                        <span className="text-xs text-muted-foreground capitalize mt-1">{account.platform}</span>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{account.totalPosts} posts</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No accounts connected</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Connect your social media accounts.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/accounts">Connect Accounts</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
