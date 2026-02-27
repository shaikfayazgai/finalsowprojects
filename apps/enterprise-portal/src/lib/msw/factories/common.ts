let counter = 0

export function randomId(prefix: string): string {
  counter++
  return `${prefix}-${String(counter).padStart(3, '0')}`
}

export function isoNow(): string {
  return new Date().toISOString()
}
