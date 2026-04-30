import SetPasswordForm from './set-password-form'

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  return <SetPasswordForm isChange={mode === 'change'} />
}
