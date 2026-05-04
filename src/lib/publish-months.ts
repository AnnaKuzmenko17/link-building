const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getPublishMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const now = new Date()
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    options.push({ value, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` })
  }
  return options
}

export function formatPublishMonth(iso: string): string {
  const [year, month] = iso.split('-')
  const monthIndex = Number(month) - 1
  return `${MONTHS[monthIndex]} ${year}`
}
