"use client";

import { useState } from "react";

import type { User } from "@/types";

import { Button } from "@/components/ui";

import { ChangePasswordDialog } from "./change-password-dialog";
import { EditProfileSheet } from "./edit-profile-sheet";

interface Props {
  profile: User;
}

export function ProfileActions({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  function handleEditOpen() {
    setEditOpen(true);
  }
  function handlePasswordOpen() {
    setPasswordOpen(true);
  }

  return (
    <div className="contents">
      <Button variant="outline" onClick={handleEditOpen}>
        Edit Profile
      </Button>
      <Button variant="outline" onClick={handlePasswordOpen}>
        Change Password
      </Button>

      <EditProfileSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile}
      />
      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
