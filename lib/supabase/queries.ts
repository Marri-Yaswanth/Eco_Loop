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
  const result = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  
  return {
    data: result.data as { role: string } | null,
    error: result.error,
  }
}

export async function upsertProfile(data: {
  id: string
  name: string
  role?: 'user' | 'driver' | 'admin'
}) {
  return supabase
    .from('profiles')
    .upsert(data as Record<string, any>, { onConflict: 'id' })
}

export async function updateUserAddress(
  id: string,
  updates: Partial<Tables['user_addresses']['Update']>
) {
  return supabase
    .from('user_addresses')
    .update(updates as Record<string, any>)
    .eq('id', id)
}

export async function insertUserAddress(
  data: Tables['user_addresses']['Insert']
) {
  return supabase
    .from('user_addresses')
    .insert(data as Record<string, any>)
}

export async function deleteUserAddress(id: string) {
  return supabase
    .from('user_addresses')
    .delete()
    .eq('id', id)
}

export async function updateWasteCategory(
  id: string,
  updates: Partial<Tables['waste_categories']['Update']>
) {
  return supabase
    .from('waste_categories')
    .update(updates as Record<string, any>)
    .eq('id', id)
}

export async function insertWasteCategory(
  data: Tables['waste_categories']['Insert']
) {
  return supabase
    .from('waste_categories')
    .insert(data as Record<string, any>)
}

export async function deleteWasteCategory(id: string) {
  return supabase
    .from('waste_categories')
    .delete()
    .eq('id', id)
}

export async function updateCollection(
  id: string,
  updates: Record<string, any>
) {
  return supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
}
