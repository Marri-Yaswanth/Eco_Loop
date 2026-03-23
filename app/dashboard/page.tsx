'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { Plus, Package, Clock, CheckCircle, Trash2, MapPin } from 'lucide-react'

interface Stats {
  total: number
  pending: number
  approved: number
  completed: number
}

interface WasteRequest {
  id: string
  waste_type: string
  quantity: number
  pickup_date: string
  status: string
  priority: string
  created_at: string
}

export default function UserDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, completed: 0 })
  const [recentRequests, setRecentRequests] = useState<WasteRequest[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/login')
        return
      }

      if (profileData.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }

      setProfile(profileData)
      await loadDashboardData(user.id)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadDashboardData(userId: string) {
    try {
      // Get all requests
      const { data: requests } = await supabase
        .from('waste_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (requests) {
        // Calculate stats
        const total = requests.length
        const pending = requests.filter(r => r.status === 'pending').length
        const approved = requests.filter(r => r.status === 'approved').length
        
        // Get completed collections count
        const { data: collections } = await supabase
          .from('collections')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
        
        const completed = collections?.length || 0

        setStats({ total, pending, approved, completed })
        setRecentRequests(requests.slice(0, 5))
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BrandLogo compact />
              <div>
                <h1 className="text-2xl font-bold text-foreground">EcoLoop</h1>
                <p className="text-sm text-muted-foreground">Welcome, {profile.name}!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Link href="/collections/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready for collection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Collection Requests</CardTitle>
                <CardDescription>Your latest waste collection requests</CardDescription>
              </div>
              <Link href="/collections">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600 mb-4">Create your first waste collection request</p>
                <Link href="/collections/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{request.waste_type}</h4>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {request.quantity} kg
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(request.pickup_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link href={`/collections/${request.id}`}>
                      <Button variant="ghost" size="sm">View Details</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link href="/collections/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Plus className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>New Request</CardTitle>
                <CardDescription>Submit a new waste collection request</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/addresses">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <MapPin className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Manage Addresses</CardTitle>
                <CardDescription>Add or update your collection addresses</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Package className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your account information</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
