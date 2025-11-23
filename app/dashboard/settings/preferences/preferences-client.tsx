"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail } from "lucide-react";

type PreferencesClientProps = {
  user: {
    name: string;
    email: string;
  };
};

export default function PreferencesClient({
  user,
}: Omit<PreferencesClientProps, "tenants">) {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState(true);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-start gap-4 p-4 pt-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Manage your appearance and notification settings
          </p>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose what updates you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Mail className="text-muted-foreground h-5 w-5" />
                <div className="space-y-1">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-muted-foreground text-sm">
                    Receive emails about new invitations
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Bell className="text-muted-foreground h-5 w-5" />
                <div className="space-y-1">
                  <Label htmlFor="team-updates">Team Updates</Label>
                  <p className="text-muted-foreground text-sm">
                    Receive notifications about team changes
                  </p>
                </div>
              </div>
              <Switch
                id="team-updates"
                checked={teamUpdates}
                onCheckedChange={setTeamUpdates}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Info (Read Only) */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Display Name</Label>
              <div className="border-input bg-muted flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
                {user.name}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email Address</Label>
              <div className="border-input bg-muted flex h-10 w-full items-center rounded-md border px-3 py-2 text-sm">
                {user.email}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
