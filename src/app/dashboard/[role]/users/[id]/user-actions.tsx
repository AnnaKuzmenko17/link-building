"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Role } from "@/types";
import { toast } from "sonner";

import type {
  ActiveCopywriter,
  ActiveOrderForReassign,
  UserWithManager,
} from "@/lib/data/users";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@/components/ui";

import {
  activateUserAction,
  disableSourcerAction,
  disableUserAction,
  getDisablePreCheckAction,
  resendInviteAction,
} from "./actions";
import { AssignManagerDialog } from "./assign-manager-dialog";
import { EditUserSheet } from "./edit-user-sheet";
import { ReassignOrdersSheet } from "./reassign-orders-sheet";

interface Props {
  targetUser: UserWithManager;
  viewerRole: Role;
  currentUserId: string;
  activeManagers: { id: string; first_name: string; last_name: string }[];
}

type ReassignData = {
  orders: ActiveOrderForReassign[];
  copywriters: ActiveCopywriter[];
};

export function UserActions({
  targetUser,
  viewerRole,
  currentUserId,
  activeManagers,
}: Props) {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [simpleDisableOpen, setSimpleDisableOpen] = useState(false);
  const [sourcerDisableOpen, setSourcerDisableOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignData, setReassignData] = useState<ReassignData | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [assignManagerOpen, setAssignManagerOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const isAdmin = viewerRole === "admin";
  const isManager = viewerRole === "manager";
  const isSelf = targetUser.id === currentUserId;
  const isPending = targetUser.status === "pending";
  const isDisabled = targetUser.status === "disabled";
  const isActive = targetUser.status === "active";

  const canEdit =
    isAdmin ||
    (isManager && targetUser.role !== "admin" && targetUser.role !== "manager");
  const canResend = isPending;
  const canDisable = isAdmin && !isSelf && isActive;
  const canActivate = isAdmin && !isSelf && isDisabled;
  const canAssignManager = isAdmin && targetUser.role === "client";

  async function handleResendConfirm() {
    setPending("resend");
    const result = await resendInviteAction(targetUser.id);
    setPending(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Invite resent.");
    setResendOpen(false);
  }

  async function handleDisableClick() {
    setPending("disable");
    const check = await getDisablePreCheckAction(targetUser.id);
    setPending(null);

    if ("success" in check && !check.success) {
      toast.error(check.error);
      return;
    }

    if ("type" in check) {
      if (check.type === "sourcer") {
        setSourcerDisableOpen(true);
      } else if (check.type === "copywriter_reassign") {
        setReassignData({
          orders: check.orders,
          copywriters: check.copywriters,
        });
        setReassignOpen(true);
      } else {
        setSimpleDisableOpen(true);
      }
    }
  }

  async function handleSimpleDisableConfirm() {
    setPending("simpleDisable");
    const result = await disableUserAction(targetUser.id);
    setPending(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User disabled.");
    setSimpleDisableOpen(false);
    router.refresh();
  }

  async function handleSourcerDisableConfirm() {
    setPending("sourcerDisable");
    const result = await disableSourcerAction(targetUser.id);
    setPending(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User disabled.");
    setSourcerDisableOpen(false);
    router.refresh();
  }

  async function handleActivateConfirm() {
    setPending("activate");
    const result = await activateUserAction(targetUser.id);
    setPending(null);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("User activated.");
    setActivateOpen(false);
    router.refresh();
  }

  return (
    <div className="contents">
      {canEdit && (
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
      )}
      {canResend && (
        <Button variant="outline" onClick={() => setResendOpen(true)}>
          Resend Invite
        </Button>
      )}
      {canDisable && (
        <Button
          variant="destructive"
          disabled={pending === "disable"}
          onClick={handleDisableClick}
        >
          {pending === "disable" ? "Checking…" : "Disable"}
        </Button>
      )}
      {canActivate && (
        <Button variant="outline" onClick={() => setActivateOpen(true)}>
          Activate
        </Button>
      )}
      {canAssignManager && (
        <Button variant="outline" onClick={() => setAssignManagerOpen(true)}>
          Assign Manager
        </Button>
      )}

      <EditUserSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        user={targetUser}
        viewerRole={viewerRole}
      />

      <ConfirmDialog
        open={resendOpen}
        onOpenChange={setResendOpen}
        title="Resend Invite"
        description={`Resend the invitation email to ${targetUser.email}?`}
        confirmLabel="Resend"
        onConfirm={handleResendConfirm}
        isLoading={pending === "resend"}
      />

      <ConfirmDialog
        open={simpleDisableOpen}
        onOpenChange={setSimpleDisableOpen}
        title="Disable User"
        description={`Are you sure you want to disable ${targetUser.first_name} ${targetUser.last_name}?`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleSimpleDisableConfirm}
        isLoading={pending === "simpleDisable"}
      />

      <ConfirmDialog
        open={sourcerDisableOpen}
        onOpenChange={setSourcerDisableOpen}
        title="Disable Sourcer"
        description={`Disabling this sourcer will remove them from all their sites. Continue?`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleSourcerDisableConfirm}
        isLoading={pending === "sourcerDisable"}
      />

      {reassignData && (
        <ReassignOrdersSheet
          open={reassignOpen}
          onOpenChange={setReassignOpen}
          targetUserId={targetUser.id}
          orders={reassignData.orders}
          copywriters={reassignData.copywriters}
        />
      )}

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate User"
        description={`Activate ${targetUser.first_name} ${targetUser.last_name}'s account?`}
        confirmLabel="Activate"
        onConfirm={handleActivateConfirm}
        isLoading={pending === "activate"}
      />

      <AssignManagerDialog
        open={assignManagerOpen}
        onOpenChange={setAssignManagerOpen}
        targetUserId={targetUser.id}
        currentManagerId={targetUser.manager_id}
        managers={activeManagers}
      />
    </div>
  );
}
