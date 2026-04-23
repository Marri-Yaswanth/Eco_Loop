'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getProfileRole } from '@/lib/supabase/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, Truck, Plus, Edit, Trash2 } from 'lucide-react'

interface Vehicle {
  id: string
  vehicle_number: string
  vehicle_type: string
  capacity: number
  status: string
  created_at: string
}

export default function VehiclesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    capacity: '',
    status: 'available',
  })

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

    await loadVehicles()
  }

  async function loadVehicles() {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setVehicles(data || [])
    } catch (error) {
      console.error('Error loading vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingVehicle(null)
    setFormData({
      vehicle_number: '',
      vehicle_type: '',
      capacity: '',
      status: 'available',
    })
    setDialogOpen(true)
  }

  function openEditDialog(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity.toString(),
      status: vehicle.status,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const vehicleData = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        capacity: parseFloat(formData.capacity),
        status: formData.status,
      }

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Vehicle updated successfully',
        })
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleData)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Vehicle added successfully',
        })
      }

      setDialogOpen(false)
      await loadVehicles()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to save vehicle',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(vehicleId: string) {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully',
      })

      await loadVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete vehicle',
        variant: 'destructive',
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'in_use': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
                <Truck className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">Vehicle Management</h1>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingVehicle ? 'Update vehicle details' : 'Add a new vehicle to the fleet'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                    <Input
                      id="vehicle_number"
                      placeholder="e.g., TRK-001"
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle_type">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicle_type}
                      onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Pickup">Pickup</SelectItem>
                        <SelectItem value="Compactor">Compactor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (tons) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g., 5.0"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in_use">In Use</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingVehicle ? 'Update' : 'Add'} Vehicle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles yet</h3>
              <p className="text-gray-600 mb-4">Add your first vehicle to the fleet</p>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">{vehicle.vehicle_number}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  <CardDescription>{vehicle.vehicle_type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Capacity:</strong> {vehicle.capacity} tons
                    </p>
                    <p className="text-xs text-gray-400">
                      Added: {new Date(vehicle.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(vehicle)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
