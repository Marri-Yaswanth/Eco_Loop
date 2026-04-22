export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'user' | 'driver' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role: 'user' | 'driver' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'user' | 'driver' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          zip_code: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          address_line1: string
          address_line2?: string | null
          city: string
          state: string
          zip_code: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          state?: string
          zip_code?: string
          is_default?: boolean
          created_at?: string
        }
      }
      waste_requests: {
        Row: {
          id: string
          user_id: string
          waste_type: string
          quantity: number
          pickup_date: string
          pickup_time: string | null
          address: string
          description: string | null
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          priority: 'low' | 'medium' | 'high'
          special_instructions: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          waste_type: string
          quantity: number
          pickup_date: string
          pickup_time?: string | null
          address: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          special_instructions?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          waste_type?: string
          quantity?: number
          pickup_date?: string
          pickup_time?: string | null
          address?: string
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          special_instructions?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      collections: {
        Row: {
          id: string
          waste_request_id: string
          user_id: string
          vehicle_id: string | null
          driver_id: string | null
          status: 'scheduled' | 'in_progress' | 'completed'
          pickup_date: string | null
          pickup_time: string | null
          actual_pickup_time: string | null
          completion_time: string | null
          collection_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          waste_request_id: string
          user_id: string
          vehicle_id?: string | null
          driver_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          pickup_date?: string | null
          pickup_time?: string | null
          actual_pickup_time?: string | null
          completion_time?: string | null
          collection_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          waste_request_id?: string
          user_id?: string
          vehicle_id?: string | null
          driver_id?: string | null
          status?: 'scheduled' | 'in_progress' | 'completed'
          pickup_date?: string | null
          pickup_time?: string | null
          actual_pickup_time?: string | null
          completion_time?: string | null
          collection_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          vehicle_number: string
          vehicle_type: string
          capacity: number | null
          status: 'available' | 'in_use' | 'maintenance'
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_number: string
          vehicle_type: string
          capacity?: number | null
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_number?: string
          vehicle_type?: string
          capacity?: number | null
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          phone: string
          license_number: string
          status: 'available' | 'on_duty' | 'off_duty'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          license_number: string
          status?: 'available' | 'on_duty' | 'off_duty'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          license_number?: string
          status?: 'available' | 'on_duty' | 'off_duty'
          created_at?: string
        }
      }
      transportation: {
        Row: {
          id: string
          collection_id: string
          vehicle_id: string
          driver_id: string
          start_location: string | null
          destination: string | null
          current_location: string | null
          status: 'pending' | 'in_transit' | 'completed'
          estimated_departure: string | null
          estimated_arrival: string | null
          actual_departure: string | null
          actual_arrival: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          vehicle_id: string
          driver_id: string
          start_location?: string | null
          destination?: string | null
          current_location?: string | null
          status?: 'pending' | 'in_transit' | 'completed'
          estimated_departure?: string | null
          estimated_arrival?: string | null
          actual_departure?: string | null
          actual_arrival?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          vehicle_id?: string
          driver_id?: string
          start_location?: string | null
          destination?: string | null
          current_location?: string | null
          status?: 'pending' | 'in_transit' | 'completed'
          estimated_departure?: string | null
          estimated_arrival?: string | null
          actual_departure?: string | null
          actual_arrival?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      waste_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      segregations: {
        Row: {
          id: string
          collection_id: string
          category_id: string
          quantity: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          category_id: string
          quantity?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          category_id?: string
          quantity?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      collection_feedback: {
        Row: {
          id: string
          collection_id: string
          user_id: string
          pickup_rating: number
          driver_behavior_rating: number
          feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          user_id: string
          pickup_rating: number
          driver_behavior_rating: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          user_id?: string
          pickup_rating?: number
          driver_behavior_rating?: number
          feedback?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
