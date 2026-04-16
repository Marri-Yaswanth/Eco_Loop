import { createClient } from '@supabase/supabase-js'
import { createSupabaseFetch, getSupabaseConfig } from './config'

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel Project Settings -> Environment Variables.'
  )
}

// For client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createSupabaseFetch(supabaseUrl),
  },
})

// For server components and API routes
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createSupabaseFetch(supabaseUrl),
    },
  })
}
