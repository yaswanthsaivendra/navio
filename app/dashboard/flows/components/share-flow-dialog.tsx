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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Trash2, Link2, Code, Mail, QrCode } from "lucide-react";
import EmbedCodeGenerator from "./embed-code-generator";

type FlowShare = {
  id: string;
  shareToken: string;
  viewCount: number;
} | null;

type ShareFlowDialogProps = {
  flowId: string;
  flowName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ShareFlowDialog({
  flowId,
  flowName,
  open,
  onOpenChange,
}: ShareFlowDialogProps) {
  const [share, setShare] = useState<FlowShare>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("link");

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
      setActiveTab("link"); // Reset to link tab when dialog opens
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
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Share Flow</DialogTitle>
          <DialogDescription>
            {flowName ? `Share "${flowName}"` : "Share this flow with anyone"}
          </DialogDescription>
        </DialogHeader>

        {loading && !share ? (
          <div className="space-y-4 py-4">
            <div className="bg-muted h-10 animate-pulse rounded-md" />
            <div className="bg-muted h-32 animate-pulse rounded-md" />
          </div>
        ) : share ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="link" className="gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Link</span>
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Embed</span>
              </TabsTrigger>
              <TabsTrigger value="email" disabled className="gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="qr" disabled className="gap-2">
                <QrCode className="h-4 w-4" />
                <span className="hidden sm:inline">QR Code</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 flex-1 overflow-y-auto">
              <TabsContent value="link" className="mt-0 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Share Link</label>
                    <p className="text-muted-foreground text-xs">
                      Copy this link to share your flow. Anyone with the link
                      can view it.
                    </p>
                    <div className="flex gap-2">
                      <div className="bg-muted min-w-0 flex-1 rounded-md border px-3 py-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="w-full truncate bg-transparent text-sm outline-none"
                          onClick={(e) =>
                            (e.target as HTMLInputElement).select()
                          }
                        />
                      </div>
                      <Button
                        onClick={handleCopyLink}
                        size="sm"
                        variant="outline"
                        disabled={copied}
                        className="shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </>
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

                  {/* Stats */}
                  <div className="bg-muted/50 rounded-md p-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Views: </span>
                      <span className="font-medium">{share.viewCount}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="embed" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Embed Code</label>
                  <p className="text-muted-foreground text-xs">
                    Copy the code below to embed this flow in your website,
                    documentation, or email.
                  </p>
                </div>
                <EmbedCodeGenerator
                  token={share.shareToken}
                  flowName={flowName}
                />
              </TabsContent>

              <TabsContent value="email" className="mt-0 space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="mb-2 font-semibold">Email Sharing</h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Send your flow directly via email. Coming soon!
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="qr" className="mt-0 space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <QrCode className="text-muted-foreground mb-4 h-12 w-12" />
                  <h3 className="mb-2 font-semibold">QR Code</h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Generate a QR code for easy sharing. Coming soon!
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
