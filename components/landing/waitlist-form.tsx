"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  variant?: "light" | "dark";
  className?: string;
}

export function WaitlistForm({
  variant = "light",
  className,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
    setEmail("");
  };

  const isDark = variant === "dark";

  if (status === "success") {
    return (
      <div className={cn("animate-fade-up flex items-center gap-3", className)}>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isDark ? "bg-primary/20" : "bg-primary/10"
          )}
        >
          <CheckCircle className="text-primary h-5 w-5" />
        </div>
        <div>
          <p
            className={cn(
              "font-medium",
              isDark ? "text-white" : "text-foreground"
            )}
          >
            You&apos;re on the list!
          </p>
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white/70" : "text-muted-foreground"
            )}
          >
            We&apos;ll be in touch soon with early access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          placeholder="Enter your work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={cn(
            "h-12 rounded-xl px-4 text-base sm:flex-1",
            isDark
              ? "focus-visible:border-primary focus-visible:ring-primary/30 border-white/20 bg-white/10 text-white placeholder:text-white/50"
              : "border-border bg-card"
          )}
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "h-12 rounded-xl px-6 text-base font-medium",
            isDark && "bg-primary hover:bg-primary/90"
          )}
        >
          {status === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Join the waitlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p
        className={cn(
          "mt-3 text-sm",
          isDark ? "text-white/60" : "text-muted-foreground"
        )}
      >
        No spam, ever. Get early access and product updates only.
      </p>
    </form>
  );
}
