'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getProfileRole, updateWasteCategory, insertWasteCategory, deleteWasteCategory } from '@/lib/supabase/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, Package, Plus, Edit, Trash2 } from 'lucide-react'

interface WasteCategory {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  created_at: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<WasteCategory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WasteCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10b981',
    icon: 'package',
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

    await loadCategories()
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('waste_categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: '',
      color: '#10b981',
      icon: 'package',
    })
    setDialogOpen(true)
  }

  function openEditDialog(category: WasteCategory) {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#10b981',
      icon: category.icon || 'package',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingCategory) {
        const { error } = await updateWasteCategory(editingCategory.id, formData)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        })
      } else {
        const { error } = await insertWasteCategory(formData)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Category added successfully',
        })
      }

      setDialogOpen(false)
      await loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const { error } = await deleteWasteCategory(categoryId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })

      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete category',
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
                <h1 className="text-xl font-bold text-gray-900">Waste Categories</h1>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Update category details' : 'Add a new waste category'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Plastic"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe this waste category..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingCategory ? 'Update' : 'Add'} Category
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: category.color || '#10b981' }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {category.description || 'No description'}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
