let counter = 0

export function randomId(prefix: string): string {
  counter++
  return `${prefix}-${String(counter).padStart(3, '0')}`
}

export function isoNow(): string {
  return new Date().toISOString()
}

export function isoFuture(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString()
}

export function isoPast(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString()
}
