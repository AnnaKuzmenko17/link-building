'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'
import { EditProfileSheet } from './edit-profile-sheet'
import { ChangePasswordDialog } from './change-password-dialog'

interface Props {
  profile: User
}

export function ProfileActions({ profile }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <div className="contents">
      <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Profile</Button>
      <Button variant="outline" onClick={() => setPasswordOpen(true)}>Change Password</Button>

      <EditProfileSheet open={editOpen} onOpenChange={setEditOpen} profile={profile} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}
