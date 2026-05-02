'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EditUserSheet } from './edit-user-sheet'
import { ReassignOrdersSheet } from './reassign-orders-sheet'
import { AssignManagerDialog } from './assign-manager-dialog'
import {
  getDisablePreCheckAction,
  disableUserAction,
  disableSourcerAction,
  activateUserAction,
  resendInviteAction,
} from './actions'
import type { Role } from '@/types'
import type { UserWithManager, ActiveOrderForReassign, ActiveCopywriter } from '@/lib/data/users'

interface Props {
  targetUser: UserWithManager
  viewerRole: Role
  currentUserId: string
  activeManagers: { id: string; first_name: string; last_name: string }[]
}

type ReassignData = {
  orders: ActiveOrderForReassign[]
  copywriters: ActiveCopywriter[]
}

export function UserActions({ targetUser, viewerRole, currentUserId, activeManagers }: Props) {
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [resendOpen, setResendOpen] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [simpleDisableOpen, setSimpleDisableOpen] = useState(false)
  const [simpleDisableLoading, setSimpleDisableLoading] = useState(false)
  const [sourcerDisableOpen, setSourcerDisableOpen] = useState(false)
  const [sourcerDisableLoading, setSourcerDisableLoading] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)
  const [reassignData, setReassignData] = useState<ReassignData | null>(null)
  const [activateOpen, setActivateOpen] = useState(false)
  const [activateLoading, setActivateLoading] = useState(false)
  const [assignManagerOpen, setAssignManagerOpen] = useState(false)

  const isAdmin = viewerRole === 'admin'
  const isManager = viewerRole === 'manager'
  const isSelf = targetUser.id === currentUserId
  const isPending = targetUser.status === 'pending'
  const isDisabled = targetUser.status === 'disabled'
  const isActive = targetUser.status === 'active'

  const canEdit =
    isAdmin ||
    (isManager && targetUser.role !== 'admin' && targetUser.role !== 'manager')
  const canResend = isPending
  const canDisable = isAdmin && !isSelf && isActive
  const canActivate = isAdmin && !isSelf && isDisabled
  const canAssignManager = isAdmin && targetUser.role === 'client'

  async function handleResendConfirm() {
    setResendLoading(true)
    const result = await resendInviteAction(targetUser.id)
    setResendLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Invite resent.')
    setResendOpen(false)
  }

  async function handleDisableClick() {
    setDisableLoading(true)
    const check = await getDisablePreCheckAction(targetUser.id)
    setDisableLoading(false)

    if ('success' in check && !check.success) {
      toast.error(check.error)
      return
    }

    if ('type' in check) {
      if (check.type === 'sourcer') {
        setSourcerDisableOpen(true)
      } else if (check.type === 'copywriter_reassign') {
        setReassignData({ orders: check.orders, copywriters: check.copywriters })
        setReassignOpen(true)
      } else {
        setSimpleDisableOpen(true)
      }
    }
  }

  async function handleSimpleDisableConfirm() {
    setSimpleDisableLoading(true)
    const result = await disableUserAction(targetUser.id)
    setSimpleDisableLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('User disabled.')
    setSimpleDisableOpen(false)
    router.refresh()
  }

  async function handleSourcerDisableConfirm() {
    setSourcerDisableLoading(true)
    const result = await disableSourcerAction(targetUser.id)
    setSourcerDisableLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('User disabled.')
    setSourcerDisableOpen(false)
    router.refresh()
  }

  async function handleActivateConfirm() {
    setActivateLoading(true)
    const result = await activateUserAction(targetUser.id)
    setActivateLoading(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('User activated.')
    setActivateOpen(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <Button variant="outline" onClick={() => setEditOpen(true)}>Edit</Button>
      )}
      {canResend && (
        <Button variant="outline" onClick={() => setResendOpen(true)}>Resend Invite</Button>
      )}
      {canDisable && (
        <Button variant="destructive" disabled={disableLoading} onClick={handleDisableClick}>
          {disableLoading ? 'Checking…' : 'Disable'}
        </Button>
      )}
      {canActivate && (
        <Button variant="outline" onClick={() => setActivateOpen(true)}>Activate</Button>
      )}
      {canAssignManager && (
        <Button variant="outline" onClick={() => setAssignManagerOpen(true)}>Assign Manager</Button>
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
        isLoading={resendLoading}
      />

      <ConfirmDialog
        open={simpleDisableOpen}
        onOpenChange={setSimpleDisableOpen}
        title="Disable User"
        description={`Are you sure you want to disable ${targetUser.first_name} ${targetUser.last_name}?`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleSimpleDisableConfirm}
        isLoading={simpleDisableLoading}
      />

      <ConfirmDialog
        open={sourcerDisableOpen}
        onOpenChange={setSourcerDisableOpen}
        title="Disable Sourcer"
        description={`Disabling this sourcer will remove them from all their sites. Continue?`}
        confirmLabel="Disable"
        variant="destructive"
        onConfirm={handleSourcerDisableConfirm}
        isLoading={sourcerDisableLoading}
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
        isLoading={activateLoading}
      />

      <AssignManagerDialog
        open={assignManagerOpen}
        onOpenChange={setAssignManagerOpen}
        targetUserId={targetUser.id}
        currentManagerId={targetUser.manager_id}
        managers={activeManagers}
      />
    </div>
  )
}
