import SetPasswordForm from './set-password-form'

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const resolvedMode = mode === 'change' ? 'change' : 'first-login'
  return <SetPasswordForm mode={resolvedMode} />
}
