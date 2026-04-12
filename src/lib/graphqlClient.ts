import { getStorageItem } from './storage'
import { STORAGE_KEYS } from './storage'

const GRAPHQL_HTTP = import.meta.env.VITE_GRAPHQL_HTTP as string | undefined

export function getApiBase(): string {
  if (!GRAPHQL_HTTP) return ''
  return GRAPHQL_HTTP.replace(/\/graphql\/?$/, '')
}

export function isGraphQLEnabled(): boolean {
  return Boolean(GRAPHQL_HTTP)
}

export function getAuthBaseUrl(): string {
  if (!GRAPHQL_HTTP) return ''
  return GRAPHQL_HTTP.replace(/\/graphql\/?$/, '')
}

function getToken(): string | null {
  return getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null)
}

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!GRAPHQL_HTTP) throw new Error('VITE_GRAPHQL_HTTP is not set')
  const token = getToken()
  const vars = Object.fromEntries(
    Object.entries(variables ?? {}).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>
  const opMatch = /(?:query|mutation)\s+(\w+)/i.exec(query.trim())
  const operationName = opMatch?.[1]
  const body = JSON.stringify({
    query,
    variables: vars,
    ...(operationName ? { operationName } : {}),
  })
  const res = await fetch(GRAPHQL_HTTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  })
  let json: Record<string, unknown> = {}
  try {
    const text = await res.text()
    json = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    throw new Error(res.statusText || 'Некорректный JSON от GraphQL')
  }

  const gqlErrors = json.errors as Array<{ message?: string }> | undefined
  if (gqlErrors?.length) {
    const msg =
      gqlErrors
        .map((e) => e.message)
        .filter((m): m is string => Boolean(m))
        .join('; ') || 'GraphQL error'
    const err = new Error(msg) as Error & { graphqlResponse?: string }
    err.graphqlResponse = JSON.stringify(gqlErrors.map((e) => ({ message: e.message })))
    throw err
  }

  if (!res.ok) {
    const m = json.message
    const fallback =
      (typeof m === 'string' && m) ||
      (Array.isArray(m) && m.map(String).join('; ')) ||
      res.statusText ||
      'Ошибка запроса GraphQL'
    throw new Error(fallback)
  }
  if (json.data === undefined) {
    throw new Error('GraphQL: в ответе нет поля data')
  }
  return json.data as T
}
