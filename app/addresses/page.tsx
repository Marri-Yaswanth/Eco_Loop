'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { updateUserAddress, insertUserAddress, deleteUserAddress } from '@/lib/supabase/queries'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Star } from 'lucide-react'

interface Address {
  id: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  is_default: boolean
}

export default function AddressesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [userId, setUserId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
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

    setUserId(user.id)
    await loadAddresses(user.id)
  }

  async function loadAddresses(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingAddress(null)
    setFormData({
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(address: Address) {
    setEditingAddress(address)
    setFormData({
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      zip_code: address.zip_code,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await updateUserAddress(editingAddress.id, formData)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Address updated successfully',
        })
      } else {
        // Create new address
        const { error } = await insertUserAddress({
          ...formData,
          user_id: userId,
          is_default: addresses.length === 0, // First address is default
        } as Tables['user_addresses']['Insert'])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Address added successfully',
        })
      }

      setDialogOpen(false)
      await loadAddresses(userId)
    } catch (error) {
      console.error('Error saving address:', error)
      toast({
        title: 'Error',
        description: 'Failed to save address',
        variant: 'destructive',
      })
    }
  }

  async function handleSetDefault(addressId: string) {
    try {
      // Remove default from all addresses
      await updateUserAddress(addressId, { is_default: false })

      // Set new default
      const { error } = await updateUserAddress(addressId, { is_default: true })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Default address updated',
      })

      await loadAddresses(userId)
    } catch (error) {
      console.error('Error setting default:', error)
      toast({
        title: 'Error',
        description: 'Failed to set default address',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      const { error } = await deleteUserAddress(addressId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      })

      await loadAddresses(userId)
    } catch (error) {
      console.error('Error deleting address:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive',
      })
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
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAddress
                      ? 'Update your address details'
                      : 'Add a new collection address'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip_code">ZIP Code *</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingAddress ? 'Update' : 'Add'} Address
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses yet</h3>
              <p className="text-gray-600 mb-4">Add your first collection address</p>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                        {address.is_default && (
                          <Badge className="bg-green-100 text-green-800 gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{address.address_line1}</p>
                      {address.address_line2 && (
                        <p className="text-gray-600">{address.address_line2}</p>
                      )}
                      <p className="text-gray-600">
                        {address.city}, {address.state} {address.zip_code}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!address.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                          className="gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
