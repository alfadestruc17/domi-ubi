export interface User {
  id: number
  name: string
  email: string
}

export interface Profile {
  auth_user_id: number
  name: string
  email: string
  phone?: string
  role: 'customer' | 'driver' | 'store'
}

export interface Trip {
  id: number
  passenger_auth_user_id: number
  driver_auth_user_id: number | null
  status: string
  origin: { latitude: number; longitude: number; address?: string }
  destination: { latitude: number; longitude: number; address?: string }
  requested_at?: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  created_at: string
}

export interface DriverPresence {
  auth_user_id: number
  latitude: number
  longitude: number
  updated_at: string
}
