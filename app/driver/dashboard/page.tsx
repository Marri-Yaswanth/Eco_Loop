'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Bell, Clock, MapPin, Package, Phone, RefreshCw, Truck, User } from 'lucide-react'

interface DriverProfile {
  id: string
  user_id: string | null
  name: string
  phone: string
  license_number: string
  status: 'available' | 'on_duty' | 'off_duty'
}

interface CollectionItem {
  id: string
  vehicle_id: string | null
  status: 'scheduled' | 'in_progress' | 'completed'
  pickup_date: string | null
  pickup_time: string | null
  actual_pickup_time: string | null
  completion_time: string | null
  collection_notes: string | null
  created_at: string
  waste_requests: {
    id: string
    waste_type: string
    quantity: number
    address: string
    priority: 'low' | 'medium' | 'high'
    special_instructions: string | null
    profiles: {
      name: string
    } | null
  } | null
  vehicles: {
    vehicle_number: string
    vehicle_type: string
    status: string
  } | null
}

interface NotificationItem {
  id: string
  title: string
  description: string
  tone: 'default' | 'warning' | 'danger'
}

export default function DriverDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [driver, setDriver] = useState<DriverProfile | null>(null)
  const [collections, setCollections] = useState<CollectionItem[]>([])

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }

      if (profile?.role !== 'driver') {
        router.push('/dashboard')
        return
      }

      const { data: driverProfile, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (driverError || !driverProfile) {
        toast({
          title: 'Driver profile not linked',
          description: 'Ask admin to link your account in Drivers table.',
          variant: 'destructive',
        })
        router.push('/dashboard')
        return
      }

      setDriver(driverProfile)
      await loadCollections(driverProfile.id)
    } catch (error) {
      console.error('Error loading driver dashboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to load driver dashboard',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function loadCollections(driverId: string) {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        vehicle_id,
        status,
        pickup_date,
        pickup_time,
        actual_pickup_time,
        completion_time,
        collection_notes,
        created_at,
        waste_requests:waste_request_id (
          id,
          waste_type,
          quantity,
          address,
          priority,
          special_instructions,
          profiles:user_id (name)
        ),
        vehicles:vehicle_id (
          vehicle_number,
          vehicle_type,
          status
        )
      `)
      .eq('driver_id', driverId)
      .order('pickup_date', { ascending: true, nullsFirst: false })

    if (error) {
      throw error
    }

    const normalized = ((data || []) as any[]).map((row) => ({
      ...row,
      waste_requests: Array.isArray(row.waste_requests) ? row.waste_requests[0] ?? null : row.waste_requests,
      vehicles: Array.isArray(row.vehicles) ? row.vehicles[0] ?? null : row.vehicles,
    })) as CollectionItem[]

    setCollections(normalized)
  }

  async function refreshData() {
    if (!driver) return

    setRefreshing(true)
    try {
      await loadCollections(driver.id)
    } catch (error) {
      console.error('Error refreshing collections:', error)
      toast({
        title: 'Error',
        description: 'Could not refresh pickup data',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  async function updateCollectionStatus(collectionId: string, status: 'in_progress' | 'completed') {
    setUpdatingId(collectionId)

    const patch: {
      status: 'in_progress' | 'completed'
      actual_pickup_time?: string
      completion_time?: string
    } = { status }

    if (status === 'in_progress') {
      patch.actual_pickup_time = new Date().toISOString()
    }

    if (status === 'completed') {
      patch.completion_time = new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('collections')
        .update(patch)
        .eq('id', collectionId)

      if (error) throw error

      // Keep resource status aligned after completion.
      if (status === 'completed' && driver) {
        const currentCollection = collections.find((c) => c.id === collectionId)
        const updates = [
          supabase.from('drivers').update({ status: 'available' }).eq('id', driver.id),
        ]

        if (currentCollection?.vehicle_id) {
          updates.push(
            supabase.from('vehicles').update({ status: 'available' }).eq('id', currentCollection.vehicle_id)
          )
        }

        await Promise.all([
          ...updates,
        ])
      }

      toast({
        title: 'Updated',
        description: status === 'in_progress' ? 'Pickup marked in progress' : 'Pickup marked completed',
      })

      await refreshData()
    } catch (error) {
      console.error('Error updating collection status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update pickup status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  function getStatusBadge(status: CollectionItem['status']) {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const notifications = useMemo<NotificationItem[]>(() => {
    const now = new Date()

    return collections
      .filter((item) => item.status !== 'completed')
      .map((item) => {
        const pickupAt = item.pickup_date ? new Date(`${item.pickup_date}T${item.pickup_time || '09:00:00'}`) : null

        if (item.status === 'in_progress') {
          return {
            id: `${item.id}-progress`,
            title: 'Collection in progress',
            description: `${item.waste_requests?.waste_type || 'Waste'} pickup is currently active.`,
            tone: 'warning',
          }
        }

        if (pickupAt && pickupAt.getTime() < now.getTime()) {
          return {
            id: `${item.id}-overdue`,
            title: 'Pickup overdue',
            description: `Scheduled pickup for ${item.waste_requests?.waste_type || 'waste'} is overdue.`,
            tone: 'danger',
          }
        }

        return {
          id: `${item.id}-scheduled`,
          title: 'New pickup assigned',
          description: `${item.waste_requests?.waste_type || 'Waste'} pickup assigned${pickupAt ? ` for ${pickupAt.toLocaleString()}` : ''}.`,
          tone: 'default',
        }
      })
  }, [collections])

  const activeCollections = collections.filter((item) => item.status !== 'completed')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading driver dashboard...</p>
      </div>
    )
  }

  if (!driver) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-sm text-gray-600">Pickup notifications and assigned collection details</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={refreshData} disabled={refreshing} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="ghost">Back</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Driver</CardDescription>
              <CardTitle className="text-lg">{driver?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {driver?.phone}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Pickups</CardDescription>
              <CardTitle className="text-2xl">{activeCollections.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Scheduled or in-progress assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Notifications</CardDescription>
              <CardTitle className="text-2xl">{notifications.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Pickup alerts requiring your attention</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <CardTitle>Pickup Notifications</CardTitle>
            </div>
            <CardDescription>Latest alerts for your assigned routes</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-600">No active notifications right now.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notice) => (
                  <div
                    key={notice.id}
                    className={`rounded-lg border p-4 ${
                      notice.tone === 'danger'
                        ? 'border-red-300 bg-red-50'
                        : notice.tone === 'warning'
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{notice.title}</p>
                    <p className="text-sm text-gray-700">{notice.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Waste Collections</CardTitle>
            <CardDescription>Pickup details and action controls</CardDescription>
          </CardHeader>
          <CardContent>
            {collections.length === 0 ? (
              <p className="text-sm text-gray-600">No collections have been assigned yet.</p>
            ) : (
              <div className="space-y-4">
                {collections.map((collection) => (
                  <div key={collection.id} className="rounded-lg border p-4 space-y-4 hover:bg-accent/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-gray-900">
                          {collection.waste_requests?.waste_type || 'Waste Pickup'}
                        </h3>
                      </div>
                      <Badge className={getStatusBadge(collection.status)}>
                        {collection.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer: {collection.waste_requests?.profiles?.name || 'Unknown'}
                      </p>
                      <p className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Vehicle: {collection.vehicles?.vehicle_number || 'Unassigned'}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pickup: {collection.pickup_date ? new Date(collection.pickup_date).toLocaleDateString() : 'N/A'}
                        {collection.pickup_time ? ` at ${collection.pickup_time}` : ''}
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>{collection.waste_requests?.address || 'No address available'}</span>
                      </p>
                    </div>

                    <p className="text-sm text-gray-700">
                      Quantity: <strong>{collection.waste_requests?.quantity ?? 0} kg</strong>
                    </p>

                    {collection.waste_requests?.special_instructions && (
                      <p className="text-sm text-gray-700">
                        Special Instructions: {collection.waste_requests.special_instructions}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      {collection.status === 'scheduled' && (
                        <Button
                          onClick={() => updateCollectionStatus(collection.id, 'in_progress')}
                          disabled={updatingId === collection.id}
                        >
                          {updatingId === collection.id ? 'Updating...' : 'Start Pickup'}
                        </Button>
                      )}

                      {collection.status === 'in_progress' && (
                        <Button
                          onClick={() => updateCollectionStatus(collection.id, 'completed')}
                          disabled={updatingId === collection.id}
                        >
                          {updatingId === collection.id ? 'Updating...' : 'Mark as Completed'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
