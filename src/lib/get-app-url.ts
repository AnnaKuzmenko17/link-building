export function getAppUrl(): string {
  const host = process.env.VERCEL_URL;
  return (
    process.env.APP_URL ?? (host ? `https://${host}` : "http://localhost:3000")
  );
}
