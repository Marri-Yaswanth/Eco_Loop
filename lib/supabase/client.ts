import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { createSupabaseFetch, getSupabaseConfig } from './config'

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel Project Settings -> Environment Variables.'
  )
}

// For client components
function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found')
  )
}

async function clearLocalAuthSession(
  client: ReturnType<typeof createClient<Database>>
): Promise<void> {
  try {
    await client.auth.signOut({ scope: 'local' })
  } catch {
    // No-op: keep recovery path resilient even if local signOut fails.
  }
}

function withRefreshTokenRecovery(client: ReturnType<typeof createClient<Database>>) {
  const originalGetUser = client.auth.getUser.bind(client.auth)

  client.auth.getUser = (async (...args: Parameters<typeof originalGetUser>) => {
    try {
      const result = await originalGetUser(...args)

      if (result.error && isInvalidRefreshTokenError(result.error)) {
        await clearLocalAuthSession(client)
        return { data: { user: null }, error: null }
      }

      return result
    } catch (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearLocalAuthSession(client)
        return { data: { user: null }, error: null }
      }

      throw error
    }
  }) as typeof client.auth.getUser

  return client
}

export const supabase = withRefreshTokenRecovery(createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createSupabaseFetch(supabaseUrl),
  },
}))

// For server components and API routes
export const createSupabaseClient = () => {
  return withRefreshTokenRecovery(createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createSupabaseFetch(supabaseUrl),
    },
  }))
}
