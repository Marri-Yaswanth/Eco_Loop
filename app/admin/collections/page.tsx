'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getProfileRole, updateCollection } from '@/lib/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, Package, Play, CheckCircle } from 'lucide-react'

interface Collection {
  id: string
  status: string
  pickup_date: string
  pickup_time?: string
  actual_pickup_time?: string
  completion_time?: string
  waste_requests: {
    waste_type: string
    quantity: number
    address: string
  }
  profiles: {
    name: string
  }
  vehicles: {
    vehicle_number: string
    vehicle_type: string
  }
  drivers: {
    name: string
    phone: string
  }
}

export default function AdminCollectionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<Collection[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await getProfileRole(user.id)

    if ((profile as { role: string } | null)?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    await loadCollections()
  }

  async function loadCollections() {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          waste_requests (waste_type, quantity, address),
          profiles (name),
          vehicles (vehicle_number, vehicle_type),
          drivers (name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCollections(data || [])
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateCollectionStatus(collectionId: string, newStatus: string) {
    try {
      const updates: any = { status: newStatus }
      
      if (newStatus === 'in_progress') {
        updates.actual_pickup_time = new Date().toISOString()
      } else if (newStatus === 'completed') {
        updates.completion_time = new Date().toISOString()
      }

      const { error } = await updateCollection(collectionId, updates)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Collection marked as ${newStatus.replace('_', ' ')}`,
      })

      await loadCollections()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update collection status',
        variant: 'destructive',
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCollections = statusFilter === 'all' 
    ? collections 
    : collections.filter(c => c.status === statusFilter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">Manage Collections</h1>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'Collections will appear here when assigned'
                  : `No ${statusFilter.replace('_', ' ')} collections`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCollections.map((collection) => (
              <Card key={collection.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg">
                          {collection.waste_requests?.waste_type || 'Unknown'}
                        </CardTitle>
                        <Badge className={getStatusColor(collection.status)}>
                          {collection.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>User:</strong> {collection.profiles?.name || 'Unknown'}
                        </div>
                        <div>
                          <strong>Quantity:</strong> {collection.waste_requests?.quantity || 0} kg
                        </div>
                        <div>
                          <strong>Vehicle:</strong> {collection.vehicles?.vehicle_number || 'N/A'}
                        </div>
                        <div>
                          <strong>Driver:</strong> {collection.drivers?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <strong>Address:</strong> {collection.waste_requests?.address || 'N/A'}
                    </p>
                    
                    {collection.pickup_date && (
                      <p className="text-sm text-gray-600">
                        <strong>Scheduled:</strong> {new Date(collection.pickup_date).toLocaleDateString()}
                        {collection.pickup_time && ` at ${collection.pickup_time}`}
                      </p>
                    )}

                    {collection.actual_pickup_time && (
                      <p className="text-sm text-gray-600">
                        <strong>Started:</strong> {new Date(collection.actual_pickup_time).toLocaleString()}
                      </p>
                    )}

                    {collection.completion_time && (
                      <p className="text-sm text-gray-600">
                        <strong>Completed:</strong> {new Date(collection.completion_time).toLocaleString()}
                      </p>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      {collection.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => updateCollectionStatus(collection.id, 'in_progress')}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Start Collection
                        </Button>
                      )}
                      {collection.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateCollectionStatus(collection.id, 'completed')}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}
                      {collection.status === 'completed' && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Collection Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
