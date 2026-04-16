'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, MapPin, User, CheckCircle, XCircle, Truck, Users, Star } from 'lucide-react'

interface CollectionFeedback {
  pickup_rating: number
  driver_behavior_rating: number
  feedback?: string | null
  created_at: string
}

interface WasteRequest {
  id: string
  user_id: string
  waste_type: string
  quantity: number
  pickup_date: string
  pickup_time?: string
  address: string
  status: string
  priority: string
  description?: string
  special_instructions?: string
  created_at: string
  profiles: { name: string; id: string } | null
  collections?: Array<{
    id: string
    status: string
    actual_pickup_time?: string
    completion_time?: string
    vehicles?: { vehicle_number: string; vehicle_type: string; status: string }
    drivers?: { name: string; phone: string; status: string }
    feedback?: CollectionFeedback | null
  }>
}

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
  status: string
}

interface Driver {
  id: string
  name: string
  phone: string
  status: string
}

export default function AdminRequestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<WasteRequest | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [selectedDriver, setSelectedDriver] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    await Promise.all([loadRequest(), loadVehicles(), loadDrivers()])
  }

  async function loadRequest() {
    try {
      const { data, error } = await supabase
        .from('waste_requests')
        .select(`
          *,
          profiles:user_id(name, id),
          collections (
            id,
            status,
            actual_pickup_time,
            completion_time,
            vehicles (vehicle_number, vehicle_type, status),
            drivers (name, phone, status)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      let collectionFeedback: CollectionFeedback | null = null
      if (data?.collections && data.collections.length > 0) {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('collection_feedback')
          .select('*')
          .eq('collection_id', data.collections[0].id)
          .maybeSingle()

        if (feedbackError) {
          console.error('Error loading feedback:', feedbackError)
        }

        collectionFeedback = feedbackData
      }

      setRequest({
        ...data,
        collections: data.collections?.map((collection: any) => ({
          ...collection,
          feedback: collectionFeedback,
        })),
      })
    } catch (error) {
      console.error('Error loading request:', error)
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      })
      router.push('/admin/requests')
    } finally {
      setLoading(false)
    }
  }

  async function loadVehicles() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available')
      .order('vehicle_number')

    setVehicles(data || [])
  }

  async function loadDrivers() {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'available')
      .order('name')

    setDrivers(data || [])
  }

  async function handleApprove() {
    try {
      const { error } = await supabase
        .from('waste_requests')
        .update({ status: 'approved' })
        .eq('id', request?.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Request approved successfully',
      })

      await loadRequest()
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      })
    }
  }

  async function handleReject() {
    if (!confirm('Are you sure you want to reject this request?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('waste_requests')
        .update({ status: 'rejected' })
        .eq('id', request?.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Request rejected',
      })

      router.push('/admin/requests')
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      })
    }
  }

  async function handleAssignCollection() {
    if (!selectedVehicle || !selectedDriver) {
      toast({
        title: 'Error',
        description: 'Please select both vehicle and driver',
        variant: 'destructive',
      })
      return
    }

    setAssigning(true)
    try {
      const collectionData = {
        waste_request_id: request?.id,
        user_id: request?.user_id,
        vehicle_id: selectedVehicle,
        driver_id: selectedDriver,
        status: 'scheduled',
        pickup_date: request?.pickup_date,
        pickup_time: request?.pickup_time,
      }

      // Create collection
      const { error: collectionError } = await supabase
        .from('collections')
        .insert(collectionData)

      if (collectionError) throw collectionError

      // Update vehicle and driver status
      await Promise.all([
        supabase.from('vehicles').update({ status: 'in_use' }).eq('id', selectedVehicle),
        supabase.from('drivers').update({ status: 'on_duty' }).eq('id', selectedDriver),
      ])

      toast({
        title: 'Success',
        description: 'Collection assigned successfully',
      })

      // Reload the page to show updated data
      await loadRequest()
    } catch (error) {
      console.error('Error assigning collection:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign collection',
        variant: 'destructive',
      })
    } finally {
      setAssigning(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function renderStars(value: number) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index + 1}
            className={`h-5 w-5 ${index < value ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!request) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/requests">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Requests
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Request Details</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{request.waste_type}</CardTitle>
                  <CardDescription>Request ID: {request.id.slice(0, 8)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority} priority
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Requested By</p>
                    <p className="text-lg font-semibold">{request.profiles?.name || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Quantity</p>
                    <p className="text-lg font-semibold">{request.quantity} kg</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pickup Date & Time</p>
                    <p className="text-lg font-semibold">
                      {new Date(request.pickup_date).toLocaleDateString()}
                    </p>
                    {request.pickup_time && (
                      <p className="text-sm text-gray-600">{request.pickup_time}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Submitted</p>
                    <p className="text-sm">{new Date(request.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Collection Address</p>
                  <p className="text-gray-900">{request.address}</p>
                </div>
              </div>

              {request.description && (
                <div className="flex items-start gap-3 pt-4 border-t">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{request.description}</p>
                  </div>
                </div>
              )}

              {request.special_instructions && (
                <div className="flex items-start gap-3 pt-4 border-t">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Special Instructions</p>
                    <p className="text-gray-900">{request.special_instructions}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {request.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Review Request</CardTitle>
                <CardDescription>Approve or reject this collection request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={handleApprove} className="flex-1 gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Approve Request
                  </Button>
                  <Button onClick={handleReject} variant="destructive" className="flex-1 gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {request.collections && request.collections.length > 0 && request.collections[0]?.feedback && (
            <Card>
              <CardHeader>
                <CardTitle>User Feedback</CardTitle>
                <CardDescription>Ratings submitted after the waste pickup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Pickup Experience</p>
                    {renderStars(request.collections[0].feedback!.pickup_rating)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Driver Behavior</p>
                    {renderStars(request.collections[0].feedback!.driver_behavior_rating)}
                  </div>
                </div>
                {request.collections[0].feedback?.feedback && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-1">Comment</p>
                    <p className="text-gray-900">{request.collections[0].feedback.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Collection Info Card */}
          {request.collections && request.collections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Assignment</CardTitle>
                <CardDescription>Assigned resources and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {request.collections[0].vehicles && (
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned Vehicle</p>
                        <p className="text-lg font-semibold">
                          {request.collections[0].vehicles.vehicle_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.collections[0].vehicles.vehicle_type}
                        </p>
                        <Badge className="mt-1">
                          {request.collections[0].vehicles.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {request.collections[0].drivers && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Assigned Driver</p>
                        <p className="text-lg font-semibold">
                          {request.collections[0].drivers.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.collections[0].drivers.phone}
                        </p>
                        <Badge className="mt-1">
                          {request.collections[0].drivers.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-2">Collection Status</p>
                      <Badge className="mb-2 capitalize">
                        {request.collections[0].status.replace('_', ' ')}
                      </Badge>
                      
                      {request.pickup_date && request.pickup_time && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Expected Arrival:</strong>{' '}
                          {new Date(request.pickup_date + 'T' + request.pickup_time).toLocaleString()}
                        </p>
                      )}
                      
                      {request.collections[0].actual_pickup_time && (
                        <p className="text-sm text-gray-600">
                          <strong>Actual Pickup:</strong>{' '}
                          {new Date(request.collections[0].actual_pickup_time).toLocaleString()}
                        </p>
                      )}
                      
                      {request.collections[0].completion_time && (
                        <p className="text-sm text-gray-600">
                          <strong>Completed:</strong>{' '}
                          {new Date(request.collections[0].completion_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Card */}
          {request.status === 'approved' && (!request.collections || request.collections.length === 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Collection</CardTitle>
                <CardDescription>Assign a vehicle and driver to this collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Select Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No available vehicles</div>
                      ) : (
                        vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              {vehicle.vehicle_number} - {vehicle.vehicle_type}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver">Select Driver</Label>
                  <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No available drivers</div>
                      ) : (
                        drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {driver.name} - {driver.phone}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAssignCollection}
                  disabled={assigning || !selectedVehicle || !selectedDriver}
                  className="w-full"
                >
                  {assigning ? 'Assigning...' : 'Assign Collection'}
                </Button>
              </CardContent>
            </Card>
          )}

          {request.status === 'rejected' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-center text-red-800">This request has been rejected</p>
              </CardContent>
            </Card>
          )}

          {request.status === 'cancelled' && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-center text-gray-800">This request was cancelled by the user</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
