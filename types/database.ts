export type UserRole = 'user' | 'driver' | 'admin'

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface UserAddress {
  id: string
  user_id: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
  created_at: string
}

export type WasteRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type WasteRequestPriority = 'low' | 'medium' | 'high'

export interface WasteRequest {
  id: string
  user_id: string
  waste_type: string
  quantity: number
  pickup_date: string
  pickup_time?: string
  address: string
  description?: string
  status: WasteRequestStatus
  priority: WasteRequestPriority
  special_instructions?: string
  created_at: string
  updated_at: string
}

export type CollectionStatus = 'scheduled' | 'in_progress' | 'completed'

export interface Collection {
  id: string
  waste_request_id: string
  user_id: string
  vehicle_id?: string
  driver_id?: string
  status: CollectionStatus
  pickup_date?: string
  pickup_time?: string
  actual_pickup_time?: string
  completion_time?: string
  collection_notes?: string
  created_at: string
  updated_at: string
}

export type VehicleStatus = 'available' | 'in_use' | 'maintenance'

export interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
  capacity?: number
  status: VehicleStatus
  created_at: string
}

export type DriverStatus = 'available' | 'on_duty' | 'off_duty'

export interface Driver {
  id: string
  name: string
  phone: string
  license_number: string
  status: DriverStatus
  created_at: string
}

export type TransportationStatus = 'pending' | 'in_transit' | 'completed'

export interface Transportation {
  id: string
  collection_id: string
  vehicle_id: string
  driver_id: string
  start_location?: string
  destination?: string
  current_location?: string
  status: TransportationStatus
  estimated_departure?: string
  estimated_arrival?: string
  actual_departure?: string
  actual_arrival?: string
  created_at: string
  updated_at: string
}

export interface WasteCategory {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  created_at: string
}

export interface Segregation {
  id: string
  collection_id: string
  category_id: string
  quantity?: number
  notes?: string
  created_at: string
}

export interface CollectionFeedback {
  id: string
  collection_id: string
  user_id: string
  pickup_rating: number
  driver_behavior_rating: number
  feedback?: string | null
  created_at: string
  updated_at: string
}
