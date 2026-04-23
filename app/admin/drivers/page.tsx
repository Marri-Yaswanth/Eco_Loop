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
import { ArrowLeft, Users, Plus, Edit, Trash2, Phone } from 'lucide-react'

interface Driver {
  id: string
  name: string
  phone: string
  license_number: string
  status: string
  created_at: string
}

export default function DriversPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
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

    await loadDrivers()
  }

  async function loadDrivers() {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setDrivers(data || [])
    } catch (error) {
      console.error('Error loading drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingDriver(null)
    setFormData({
      name: '',
      phone: '',
      license_number: '',
      status: 'available',
    })
    setDialogOpen(true)
  }

  function openEditDialog(driver: Driver) {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      phone: driver.phone,
      license_number: driver.license_number,
      status: driver.status,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update(formData)
          .eq('id', editingDriver.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Driver updated successfully',
        })
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert(formData)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Driver added successfully',
        })
      }

      setDialogOpen(false)
      await loadDrivers()
    } catch (error: any) {
      console.error('Error saving driver:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save driver',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(driverId: string) {
    if (!confirm('Are you sure you want to delete this driver?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Driver deleted successfully',
      })

      await loadDrivers()
    } catch (error) {
      console.error('Error deleting driver:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete driver',
        variant: 'destructive',
      })
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'on_duty': return 'bg-blue-100 text-blue-800'
      case 'off_duty': return 'bg-gray-100 text-gray-800'
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
                <Users className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">Driver Management</h1>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDriver ? 'Update driver details' : 'Add a new driver to the team'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., +1234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number *</Label>
                    <Input
                      id="license_number"
                      placeholder="e.g., DL123456"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
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
                        <SelectItem value="on_duty">On Duty</SelectItem>
                        <SelectItem value="off_duty">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingDriver ? 'Update' : 'Add'} Driver
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
        {drivers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No drivers yet</h3>
              <p className="text-gray-600 mb-4">Add your first driver to the team</p>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Driver
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drivers.map((driver) => (
              <Card key={driver.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(driver.status)}>
                      {driver.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {driver.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>License:</strong> {driver.license_number}
                    </p>
                    <p className="text-xs text-gray-400">
                      Added: {new Date(driver.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(driver)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(driver.id)}
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
