import { requireWorkspace } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Shield, Key } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { workspace } = await requireWorkspace();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and personal preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>
              Your personal account details configured through Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user?.email || ''} readOnly className="bg-muted/50 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Your email is used to log in and cannot be changed here.</p>
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id || ''} readOnly className="bg-muted/50 font-mono text-sm cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Workspace Access</CardTitle>
            </div>
            <CardDescription>
              Details about the current workspace you are operating in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input value={workspace.name || ''} readOnly className="bg-muted/50 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                  Owner
                </span>
                <span className="text-sm text-muted-foreground">You have full control over this workspace.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Authentication</CardTitle>
            </div>
            <CardDescription>
              Manage how you sign in to Investor OS.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authentication is securely managed by Supabase Auth. Since signup is disabled, only users explicitly invited or created in your Supabase project can access this portal. This ensures your data remains completely isolated and secure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
