'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { logoutAction } from '@/app/actions/logout'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await logoutAction()
    router.replace('/login')
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Log out
    </Button>
  )
}
