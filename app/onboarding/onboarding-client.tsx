"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTenant } from "@/lib/actions/tenant";
import { createInvitation } from "@/lib/actions/invitation";
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  Users,
  Building2,
} from "lucide-react";

interface EmailChip {
  email: string;
  role: "MEMBER" | "ADMIN";
}

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState("");

  // Step 2 state
  const [emailInput, setEmailInput] = useState("");
  const [emailChips, setEmailChips] = useState<EmailChip[]>([]);
  const [emailError, setEmailError] = useState("");

  // Common state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add email chip
  const handleAddEmail = () => {
    setEmailError("");

    if (!emailInput.trim()) return;

    if (!isValidEmail(emailInput)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (emailChips.some((chip) => chip.email === emailInput)) {
      setEmailError("This email has already been added");
      return;
    }

    setEmailChips([...emailChips, { email: emailInput, role: "MEMBER" }]);
    setEmailInput("");
  };

  // Remove email chip
  const handleRemoveEmail = (email: string) => {
    setEmailChips(emailChips.filter((chip) => chip.email !== email));
  };

  // Handle Enter key in email input
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Step 1: Create organization
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate
      if (!name.trim()) {
        throw new Error("Organization name is required");
      }

      // Create tenant
      const tenant = await createTenant(name.trim());
      setCreatedTenantId(tenant.id);

      // Move to step 2
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Send invites or skip
  const handleStep2Complete = async (skipInvites: boolean = false) => {
    if (skipInvites || emailChips.length === 0) {
      // Skip invites, go to dashboard
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (!createdTenantId) {
        throw new Error("Organization not found");
      }

      // Send all invitations
      await Promise.all(
        emailChips.map((chip) =>
          createInvitation(createdTenantId, chip.email, chip.role)
        )
      );

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitations"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background min-h-screen px-4 py-12">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2 opacity-30">
          <div className="bg-primary/20 absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
          <div className="bg-accent/20 absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}
            >
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <div
              className={`h-0.5 w-12 ${step > 1 ? "bg-primary" : "bg-border"}`}
            />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step === 2 ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}
            >
              2
            </div>
          </div>
          <span className="text-muted-foreground text-sm">{step} of 2</span>
        </div>

        {/* Step 1: Create Organization */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="bg-primary/10 mb-4 inline-flex rounded-full p-3">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                Welcome to Navio! 🎉
              </h1>
              <p className="text-muted-foreground mt-2">
                Let&apos;s create your organization to get started
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Organization Name */}
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
                  className="h-12 rounded-lg px-4 text-base"
                  required
                  disabled={isSubmitting}
                  maxLength={50}
                  autoFocus
                />
                {name && (
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    {name.length}/50 characters
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border-destructive text-destructive flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !name || name.trim().length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Step 2: Invite Team */}
        {step === 2 && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="bg-primary/10 mb-4 inline-flex rounded-full p-3">
                <Users className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                Invite your team
              </h1>
              <p className="text-muted-foreground mt-2">
                Collaborate better together (optional)
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  Email addresses
                </label>

                {/* Email Chips */}
                {emailChips.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {emailChips.map((chip) => (
                      <div
                        key={chip.email}
                        className="bg-primary/10 text-primary flex items-center gap-2 rounded-full px-3 py-1.5 text-sm"
                      >
                        <span>{chip.email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(chip.email)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyDown}
                    placeholder="colleague@example.com"
                    className="h-12 flex-1 rounded-lg px-4 text-base"
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleAddEmail}
                    variant="outline"
                    size="lg"
                    disabled={!emailInput.trim() || isSubmitting}
                  >
                    Add
                  </Button>
                </div>

                {emailError && (
                  <p className="text-destructive mt-1.5 text-xs">
                    {emailError}
                  </p>
                )}
                <p className="text-muted-foreground mt-1.5 text-xs">
                  Press Enter or click Add to include multiple emails
                </p>
              </div>

              {/* Info */}
              {emailChips.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-muted-foreground text-sm">
                    {emailChips.length}{" "}
                    {emailChips.length === 1 ? "person" : "people"} will receive
                    an invitation to join <strong>{name}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border-destructive text-destructive flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleStep2Complete(true)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Skip for now
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => handleStep2Complete(false)}
                disabled={isSubmitting || emailChips.length === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send {emailChips.length > 0 && `${emailChips.length} `}
                    {emailChips.length === 1 ? "Invite" : "Invites"}
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <p className="text-muted-foreground text-center text-xs">
              You can always invite more people later from your dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
