'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { InviteUserSheet } from './invite-user-sheet'
import type { Role } from '@/types'

interface Props {
  viewerRole: Role
  viewerName: string
  activeManagers: { id: string; first_name: string; last_name: string }[]
}

export function InviteUserButton({ viewerRole, viewerName, activeManagers }: Props) {
  const [open, setOpen] = useState(false)

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
  )
}
