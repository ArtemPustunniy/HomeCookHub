import { getStorageItem } from './storage'
import { STORAGE_KEYS } from './storage'

const GRAPHQL_HTTP = import.meta.env.VITE_GRAPHQL_HTTP as string | undefined

/** Base URL of the backend (e.g. http://localhost:3001) */
export function getApiBase(): string {
  if (!GRAPHQL_HTTP) return ''
  return GRAPHQL_HTTP.replace(/\/graphql\/?$/, '')
}

export function isGraphQLEnabled(): boolean {
  return Boolean(GRAPHQL_HTTP)
}

/** Base URL of the backend (e.g. http://localhost:3001) for auth endpoints */
export function getAuthBaseUrl(): string {
  if (!GRAPHQL_HTTP) return ''
  return GRAPHQL_HTTP.replace(/\/graphql\/?$/, '')
}

function getToken(): string | null {
  return getStorageItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null)
}

const DEBUG = true

export async function graphqlRequest<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!GRAPHQL_HTTP) throw new Error('VITE_GRAPHQL_HTTP is not set')
  const token = getToken()
  const vars = Object.fromEntries(
    Object.entries(variables ?? {}).filter(([, v]) => v !== undefined),
  ) as Record<string, unknown>
  const opName = query.match(/mutation\s+(\w+)|query\s+(\w+)/)?.[1] ?? query.match(/(\w+)/)?.[1] ?? '?'
  if (DEBUG) {
    console.log('[graphqlRequest] op:', opName, 'token:', !!token, 'tokenLen:', token?.length ?? 0, 'vars:', Object.keys(vars))
  }
  const res = await fetch(GRAPHQL_HTTP, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables: vars }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    const msg = json.errors.map((e: { message?: string }) => e.message).join('; ')
    const full = JSON.stringify({ errors: json.errors, data: json.data }, null, 2)
    if (DEBUG) console.error('[graphqlRequest] ERROR:', full)
    const err = new Error(msg || 'GraphQL error')
    ;(err as any).graphqlResponse = full
    throw err
  }
  if (!res.ok) throw new Error(res.statusText || 'Request failed')
  return json.data as T
}
