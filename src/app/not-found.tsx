import Link from "next/link";

import { Logo } from "@/components/shared";
import { buttonVariants } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Logo />
      <div className="space-y-2 text-center">
        <p className="text-primary text-8xl font-bold">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link href="/" className={buttonVariants()}>
        Go home
      </Link>
    </div>
  );
}
