"use client";

import { Button } from "@/components/ui";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        An unexpected error occurred while loading this page.
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          Error ID: {error.digest}
        </p>
      )}
      <Button
        onClick={reset}
        variant="outline"
        aria-label="Retry loading the page"
      >
        Try again
      </Button>
    </div>
  );
}
