/** Текст ошибки из тела ответа Nest (HttpException): в `message` обычно человекочитаемая строка, в `error` — тип вроде Conflict. */
export function httpErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback
  const o = json as Record<string, unknown>
  const m = o.message
  if (typeof m === 'string' && m.trim()) return m
  if (Array.isArray(m) && m.length) return m.map(String).join('; ')
  if (typeof o.error === 'string' && o.error.trim()) return o.error
  return fallback
}
