import { useState } from "react";
import { useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Share2, MoreHorizontal, Clock, CheckCircle2, AlertCircle, FileEdit, Search, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export default function Posts() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const { data: posts, isLoading } = useListPosts(
    { workspaceId: 1, status: statusFilter !== "all" ? (statusFilter as any) : undefined },
    { query: { queryKey: getListPostsQueryKey({ workspaceId: 1, status: statusFilter !== "all" ? (statusFilter as any) : undefined }) } }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "scheduled": return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FileEdit className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>;
      case "scheduled": return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>;
      case "failed": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default: return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">Manage your social media content.</p>
        </div>
        <Button>Create Post</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search posts..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-5 sm:w-auto h-auto">
            <TabsTrigger value="all" className="py-1.5 text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="draft" className="py-1.5 text-xs sm:text-sm">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled" className="py-1.5 text-xs sm:text-sm">Scheduled</TabsTrigger>
            <TabsTrigger value="published" className="py-1.5 text-xs sm:text-sm">Published</TabsTrigger>
            <TabsTrigger value="failed" className="py-1.5 text-xs sm:text-sm">Failed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
              <CardFooter className="pt-2 border-t mt-auto">
                <Skeleton className="h-4 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : posts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card border-dashed">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileEdit className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No posts found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
            {statusFilter !== "all" 
              ? `You don't have any ${statusFilter} posts matching your search.` 
              : "You haven't created any posts yet."}
          </p>
          <Button>Create your first post</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts?.filter(p => search === "" || p.content.toLowerCase().includes(search.toLowerCase())).map((post) => (
            <Card key={post.id} className="flex flex-col hover-elevate transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                {getStatusBadge(post.status)}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit Post</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    {post.status === 'draft' && <DropdownMenuItem>Schedule</DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <p className="text-sm line-clamp-4 whitespace-pre-wrap">{post.content}</p>
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-hidden">
                    {post.mediaUrls.map((url, i) => (
                      <div key={i} className="h-16 w-16 rounded-md bg-muted flex-shrink-0 border overflow-hidden">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  {getStatusIcon(post.status)}
                  <span>
                    {post.status === 'published' && post.publishedAt 
                      ? `Published ${new Date(post.publishedAt).toLocaleDateString()}` 
                      : post.scheduledAt 
                        ? `Scheduled ${new Date(post.scheduledAt).toLocaleString()}`
                        : `Created ${new Date(post.createdAt).toLocaleDateString()}`}
                  </span>
                </div>
              </CardContent>
              {post.status === 'published' && (
                <CardFooter className="pt-3 border-t bg-muted/20 mt-auto flex justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5" title="Likes">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Comments">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Shares">
                      <Share2 className="h-4 w-4" />
                      <span>{post.shares || 0}</span>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
