export function getAppUrl(): string {
  const appUrl = process.env.APP_URL
  const vercelUrl = process.env.VERCEL_URL
  return appUrl ?? (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000')
}
