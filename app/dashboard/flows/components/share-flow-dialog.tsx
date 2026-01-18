"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Trash2 } from "lucide-react";

type FlowShare = {
  id: string;
  shareToken: string;
  viewCount: number;
} | null;

type ShareFlowDialogProps = {
  flowId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ShareFlowDialog({
  flowId,
  open,
  onOpenChange,
}: ShareFlowDialogProps) {
  const [share, setShare] = useState<FlowShare>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch share link when dialog opens (auto-creates if missing)
  const fetchShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/share`);
      if (response.ok) {
        const result = await response.json();
        // Handle standardized API response format
        if (result.success && result.data) {
          setShare(result.data);
        } else if (result.data === null) {
          // Should not happen (auto-creation), but handle gracefully
          setShare(null);
        } else {
          setShare(result);
        }
      } else {
        const error = await response.json();
        console.error("Error fetching share:", error);
        alert(error.error?.message || "Failed to load share link");
      }
    } catch (error) {
      console.error("Error fetching share:", error);
      alert("Failed to load share link");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchShare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flowId]);

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/share`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        // Handle standardized API response format
        const shareData = result.success ? result.data : result;
        setShare(shareData);
      } else {
        const error = await response.json();
        const message =
          error.error?.message ||
          error.message ||
          "Failed to create share link";
        // Use console.error for now - can add toast later
        console.error(message);
        alert(message);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create share link";
      console.error(message, error);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/share`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShare(null);
      } else {
        const error = await response.json();
        const message =
          error.error?.message ||
          error.message ||
          "Failed to revoke share link";
        console.error(message);
        alert(message);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke share link";
      console.error(message, error);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!share) return;

    const shareUrl = `${window.location.origin}/s/${share.shareToken}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = share
    ? `${window.location.origin}/s/${share.shareToken}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Flow</DialogTitle>
          <DialogDescription>
            Copy the link below to share this flow with anyone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && !share ? (
            <div className="space-y-2">
              <div className="bg-muted h-10 animate-pulse rounded-md" />
              <div className="bg-muted h-20 animate-pulse rounded-md" />
            </div>
          ) : share ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-muted flex-1 rounded-md border px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    variant="outline"
                    disabled={copied}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteShare}
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke Link
                </Button>
                <Button
                  onClick={handleCreateShare}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="flex-1"
                >
                  Regenerate Link
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
