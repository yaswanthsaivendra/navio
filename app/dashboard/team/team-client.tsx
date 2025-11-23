"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateMemberRole, removeMember } from "@/lib/actions/membership";
import {
  createInvitation,
  cancelInvitation,
  resendInvitation,
} from "@/lib/actions/invitation";
import {
  Loader2,
  AlertCircle,
  Trash2,
  Users,
  Crown,
  Shield,
  User as UserIcon,
  Mail,
  Send,
  X as XIcon,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  inviter: {
    name: string;
    email: string;
  };
};

type TeamClientProps = {
  members: Member[];
  invitations: Invitation[];
  tenantId: string;
  tenantName: string;
  currentUserRole: string;
};

export default function TeamClient({
  members,
  invitations,
  tenantId,
  tenantName,
  currentUserRole,
}: TeamClientProps) {
  const router = useRouter();

  // Member State
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  // Invitation State
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);

  // Shared State
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageRoles =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canRemoveMembers = currentUserRole === "OWNER";
  const canInvite = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  // --- Member Handlers ---

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setError("");
    setSuccess("");
    setLoadingMemberId(membershipId);

    try {
      await updateMemberRole(
        membershipId,
        newRole as "MEMBER" | "ADMIN" | "OWNER"
      );
      setSuccess("Member role updated successfully");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    setError("");
    setSuccess("");
    setLoadingMemberId(membershipId);

    try {
      await removeMember(membershipId);
      setSuccess("Member removed successfully");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoadingMemberId(null);
    }
  };

  // --- Invitation Handlers ---

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmittingInvite(true);

    try {
      if (!email.trim()) {
        throw new Error("Email is required");
      }

      await createInvitation(tenantId, email.trim(), role);
      setSuccess(`Invitation sent to ${email}`);
      setEmail("");
      setRole("MEMBER");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    setError("");
    setSuccess("");
    setLoadingInviteId(invitationId);

    try {
      await resendInvitation(invitationId);
      setSuccess("Invitation resent successfully");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend invitation"
      );
    } finally {
      setLoadingInviteId(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setError("");
    setSuccess("");
    setLoadingInviteId(invitationId);

    try {
      await cancelInvitation(invitationId);
      setSuccess("Invitation cancelled");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel invitation"
      );
    } finally {
      setLoadingInviteId(null);
    }
  };

  // --- Helpers ---

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING"
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-start gap-4 p-4 pt-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground mt-2">
              Manage members and invitations for {tenantName}
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-destructive/10 border-destructive text-destructive flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-500">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          {/* --- MEMBERS TAB --- */}
          <TabsContent value="members" className="mt-6 space-y-6">
            <div className="border-border bg-card rounded-lg border">
              <div className="border-border border-b p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Team Members</h2>
                    <p className="text-muted-foreground text-sm">
                      View and manage team member roles
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-border bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium tracking-wider uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                              <span className="text-primary text-sm font-medium">
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {member.user.name}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {member.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {canManageRoles && member.role !== "OWNER" ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                handleRoleChange(member.id, value)
                              }
                              disabled={loadingMemberId === member.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" />
                                    Member
                                  </div>
                                </SelectItem>
                                <SelectItem value="ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                            >
                              {getRoleIcon(member.role)}
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm">
                          {new Date(member.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canRemoveMembers && member.role !== "OWNER" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={loadingMemberId === member.id}
                                >
                                  {loadingMemberId === member.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="text-destructive h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove Member?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove{" "}
                                    <strong>{member.user.name}</strong> from the
                                    team? They will lose access to this
                                    organization.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleRemoveMember(member.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove Member
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* --- INVITATIONS TAB --- */}
          <TabsContent value="invitations" className="mt-6 space-y-6">
            {/* Invite Form */}
            {canInvite && (
              <div className="border-border bg-card rounded-lg border">
                <div className="border-border border-b p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Mail className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Send Invitation</h2>
                      <p className="text-muted-foreground text-sm">
                        Invite someone to join your team
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSendInvite} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <label
                          htmlFor="email"
                          className="text-foreground mb-2 block text-sm font-medium"
                        >
                          Email Address
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="colleague@example.com"
                          required
                          disabled={isSubmittingInvite}
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label
                          htmlFor="role"
                          className="text-foreground mb-2 block text-sm font-medium"
                        >
                          Role
                        </label>
                        <Select
                          value={role}
                          onValueChange={(value) =>
                            setRole(value as "MEMBER" | "ADMIN")
                          }
                          disabled={isSubmittingInvite}
                        >
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingInvite || !email.trim()}
                    >
                      {isSubmittingInvite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Pending Invitations List */}
            <div className="border-border bg-card rounded-lg border">
              <div className="border-border border-b p-6">
                <h2 className="text-lg font-semibold">
                  Pending Invitations ({pendingInvitations.length})
                </h2>
                <p className="text-muted-foreground text-sm">
                  Invitations waiting to be accepted
                </p>
              </div>

              {pendingInvitations.length === 0 ? (
                <div className="p-12 text-center">
                  <Mail className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No pending invitations
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Send an invitation to add new team members
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-border bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Invited By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                          Sent
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium tracking-wider uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {pendingInvitations.map((invitation) => (
                        <tr key={invitation.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 font-medium">
                            {invitation.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-muted-foreground text-sm capitalize">
                              {invitation.role.toLowerCase()}
                            </span>
                          </td>
                          <td className="text-muted-foreground px-6 py-4 text-sm">
                            {invitation.inviter.name}
                          </td>
                          <td className="text-muted-foreground px-6 py-4 text-sm">
                            {new Date(invitation.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResend(invitation.id)}
                                disabled={loadingInviteId === invitation.id}
                              >
                                {loadingInviteId === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <RefreshCw className="mr-1 h-3 w-3" />
                                    Resend
                                  </>
                                )}
                              </Button>

                              {canInvite && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={
                                        loadingInviteId === invitation.id
                                      }
                                    >
                                      <XIcon className="text-destructive h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Cancel Invitation?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel the
                                        invitation to{" "}
                                        <strong>{invitation.email}</strong>?
                                        They will no longer be able to accept
                                        it.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleCancel(invitation.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Cancel Invitation
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
