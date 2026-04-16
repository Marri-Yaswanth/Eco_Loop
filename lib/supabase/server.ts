import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createSupabaseFetch, getSupabaseConfig } from './config'

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in Vercel Project Settings -> Environment Variables.'
    )
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: createSupabaseFetch(supabaseUrl),
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  })
}
