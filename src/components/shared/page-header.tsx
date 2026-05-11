import type { ReactNode } from "react";

import { BackButton } from "./back-button";

interface Props {
  title: string;
  backHref?: string;
  action?: ReactNode;
}

export function PageHeader({ title, backHref, action }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && <BackButton fallbackHref={backHref} />}
        <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
