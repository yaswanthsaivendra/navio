"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  error: string | Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
  description,
}: ErrorStateProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : error || "An unexpected error occurred";

  return (
    <Alert variant="destructive" className="max-w-2xl">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{description || errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
