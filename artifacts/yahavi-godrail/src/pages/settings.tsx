import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Twitter, Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import { SiPinterest, SiTiktok } from "react-icons/si";
import { useListAccounts } from "@workspace/api-client-react";

const WORKSPACE_ID = 1;

const PLATFORMS = [
  { id: "twitter", label: "Twitter / X", icon: Twitter, color: "bg-black", description: "Post tweets and threads" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-[#0077B5]", description: "Share professional updates" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "bg-[#1877F2]", description: "Post to pages and profiles" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#dc2743]", description: "Share photos and reels" },
  { id: "pinterest", label: "Pinterest", icon: SiPinterest, color: "bg-[#E60023]", description: "Pin to boards" },
  { id: "tiktok", label: "TikTok", icon: SiTiktok, color: "bg-black", description: "Share short-form video" },
  { id: "youtube", label: "YouTube", icon: Youtube, color: "bg-[#FF0000]", description: "Upload videos" },
];

export default function Settings() {
  const { user, token, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const { data: accounts = [], refetch: refetchAccounts } = useListAccounts(
    { workspaceId: WORKSPACE_ID },
    { query: { queryKey: ["accounts", WORKSPACE_ID] } }
  );

  const connectedPlatforms = new Set(accounts.filter((a) => a.isActive).map((a) => a.platform));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const r = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: profileForm.name, avatarUrl: profileForm.avatarUrl || null }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      updateUser(data);
      setProfileMsg("Profile updated successfully");
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setProfileSaving(false);
    }
  };

  const connectPlatform = (platform: string) => {
    window.location.href = `/api/oauth/${platform}/connect?workspaceId=${WORKSPACE_ID}`;
  };

  const disconnectAccount = async (id: number) => {
    await fetch(`/api/oauth/${id}`, { method: "DELETE" });
    refetchAccounts();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, profile, and connected social accounts.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="connections">Social Accounts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Update your name and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profileForm.avatarUrl || user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                      {(user?.name ?? "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="avatar-url">Avatar URL</Label>
                    <Input id="avatar-url" placeholder="https://example.com/photo.jpg" value={profileForm.avatarUrl}
                      onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                {profileMsg && (
                  <Alert variant={profileMsg.includes("success") ? "default" : "destructive"}>
                    <AlertDescription>{profileMsg}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={profileSaving}>
                  {profileSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={logout}>Sign Out</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Connections Tab */}
        <TabsContent value="connections" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Social Accounts</CardTitle>
              <CardDescription>Connect your social media accounts to publish content directly from Yahavi Godrail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {PLATFORMS.map((platform) => {
                const PlatformIcon = platform.icon;
                const connected = connectedPlatforms.has(platform.id as never);
                const account = accounts.find((a) => (a.platform as string) === platform.id && a.isActive);
                return (
                  <div key={platform.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-white ${platform.color}`}>
                        <PlatformIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{platform.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {connected ? account?.username : platform.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {connected && <Badge variant="secondary" className="text-green-600 bg-green-50 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" />Connected</Badge>}
                      {connected ? (
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                          onClick={() => account && disconnectAccount(account.id)}>
                          Disconnect
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => connectPlatform(platform.id)}>Connect</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> To connect Twitter, Facebook, LinkedIn, Pinterest, and TikTok, you need to add the respective API credentials (client IDs and secrets) in your Replit Secrets. See the README for the full list of required keys.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password. Minimum 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                if (pwForm.newPassword !== pwForm.confirm) { setPwMsg("Passwords do not match"); return; }
                setPwSaving(true); setPwMsg("");
                setTimeout(() => { setPwMsg("Password change not yet implemented in this build"); setPwSaving(false); }, 500);
              }}>
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input type="password" value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type="password" minLength={8} value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={pwForm.confirm}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} />
                </div>
                {pwMsg && <Alert><AlertDescription>{pwMsg}</AlertDescription></Alert>}
                <Button type="submit" disabled={pwSaving}>
                  {pwSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
