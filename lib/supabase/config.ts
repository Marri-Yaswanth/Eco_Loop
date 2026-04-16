export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return { supabaseUrl, supabaseAnonKey }
}

function isSupabaseNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('could not resolve host') ||
    message.includes('enotfound') ||
    message.includes('networkerror')
  )
}

export function createSupabaseFetch(supabaseUrl: string) {
  return async (...args: Parameters<typeof fetch>) => {
    try {
      return await fetch(...args)
    } catch (error) {
      if (isSupabaseNetworkError(error)) {
        throw new Error(
          `Unable to reach Supabase at ${supabaseUrl}. Check NEXT_PUBLIC_SUPABASE_URL in .env.local and confirm the project is active.`
        )
      }

      throw error
    }
  }
}
