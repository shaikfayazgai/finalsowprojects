let counter = 0

export function randomId(prefix: string): string {
  counter++
  return `${prefix}-${String(counter).padStart(3, '0')}`
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function isoPast(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export function isoFuture(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString()
}
