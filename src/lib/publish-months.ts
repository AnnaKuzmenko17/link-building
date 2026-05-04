export function getPublishMonthOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  const now = new Date()
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export function formatPublishMonth(iso: string): string {
  const [year, month] = iso.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
