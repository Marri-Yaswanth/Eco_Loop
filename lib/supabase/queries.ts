import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']

export async function updateWasteRequest(
  id: string,
  updates: Partial<Tables['waste_requests']['Update']>
) {
  return supabase
    .from('waste_requests')
    .update(updates as Record<string, any>)
    .eq('id', id)
}

export async function updateVehicle(
  id: string,
  updates: Partial<Tables['vehicles']['Update']>
) {
  return supabase
    .from('vehicles')
    .update(updates as Record<string, any>)
    .eq('id', id)
}

export async function updateDriver(
  id: string,
  updates: Partial<Tables['drivers']['Update']>
) {
  return supabase
    .from('drivers')
    .update(updates as Record<string, any>)
    .eq('id', id)
}

export async function insertCollection(
  data: Tables['collections']['Insert']
) {
  return supabase
    .from('collections')
    .insert(data as Record<string, any>)
}

export async function getProfileRole(userId: string) {
  return supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
}
