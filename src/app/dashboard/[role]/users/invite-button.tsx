"use client";

import { useState } from "react";

import type { Role } from "@/types";

import { Button } from "@/components/ui";

import { InviteUserSheet } from "./invite-user-sheet";
import { Manager } from "./types";

interface Props {
  viewerRole: Role;
  viewerName: string;
  activeManagers: Manager[];
}

export function InviteUserButton({
  viewerRole,
  viewerName,
  activeManagers,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite User</Button>
      <InviteUserSheet
        open={open}
        onOpenChange={setOpen}
        viewerRole={viewerRole}
        viewerName={viewerName}
        activeManagers={activeManagers}
      />
    </>
  );
}
