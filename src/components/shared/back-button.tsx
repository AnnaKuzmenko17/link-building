"use client";

import { useRouter } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

interface Props {
  fallbackHref: string;
}

export function BackButton({ fallbackHref }: Props) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
      aria-label="Go back"
      type="button"
    >
      <ArrowLeftIcon className="size-5" />
    </button>
  );
}
