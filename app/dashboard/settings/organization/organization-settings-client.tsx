"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTenant, deleteTenant } from "@/lib/actions/tenant";
import { Loader2, AlertCircle, Trash2, Building2 } from "lucide-react";
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

type Tenant = {
  id: string;
  name: string;
  role: string;
};

type OrganizationSettingsClientProps = {
  tenant: Tenant;
};

export default function OrganizationSettingsClient({
  tenant,
}: OrganizationSettingsClientProps) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        throw new Error("Organization name is required");
      }

      if (name.trim() === tenant.name) {
        setSuccess("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateTenant(tenant.id, { name: name.trim() });
      setSuccess("Organization name updated successfully");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      await deleteTenant(tenant.id);
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete organization"
      );
      setIsDeleting(false);
    }
  };

  const isOwner = tenant.role === "OWNER";

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 p-4">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization details and settings
          </p>
        </div>

        {/* Organization Details */}
        <div className="border-border bg-card rounded-lg border">
          <div className="border-border border-b p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Organization Details</h2>
                <p className="text-muted-foreground text-sm">
                  Update your organization name and information
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Organization Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  disabled={isSubmitting || !isOwner}
                  maxLength={50}
                />
                {!isOwner && (
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    Only organization owners can update the name
                  </p>
                )}
              </div>

              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  Your Role
                </label>
                <div className="border-input bg-muted flex h-10 w-full items-center rounded-md border px-3 py-2">
                  <span className="text-sm capitalize">
                    {tenant.role.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="bg-destructive/10 border-destructive text-destructive flex items-start gap-2 rounded-md border px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-500">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {isOwner && (
                <Button
                  type="submit"
                  disabled={isSubmitting || name.trim() === tenant.name}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        {isOwner && (
          <div className="border-destructive/50 bg-card rounded-lg border">
            <div className="border-destructive/50 border-b p-6">
              <h2 className="text-destructive text-lg font-semibold">
                Danger Zone
              </h2>
              <p className="text-muted-foreground text-sm">
                Irreversible and destructive actions
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">Delete Organization</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Permanently delete this organization and all its data. This
                    action cannot be undone.
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete{" "}
                        <strong>{tenant.name}</strong> and remove all associated
                        data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Organization
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
