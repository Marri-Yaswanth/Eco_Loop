'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getProfileRole } from '@/lib/supabase/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, Clock, Truck, Package, List } from 'lucide-react'
import { AdminCharts } from '@/components/dashboard/admin-charts'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'

interface Stats {
  totalUsers: number
  pendingRequests: number
  activeCollections: number
  totalVehicles: number
}

interface RecentRequest {
  id: string
  waste_type: string
  quantity: number
  status: string
  created_at: string
  profiles: { name: string } | null
}

interface ChartData {
  requestsByStatus: Array<{ name: string; value: number }>
  requestsByType: Array<{ name: string; value: number }>
  requestsOverTime: Array<{ date: string; count: number }>
}

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingRequests: 0,
    activeCollections: 0,
    totalVehicles: 0,
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [chartData, setChartData] = useState<ChartData>({
    requestsByStatus: [],
    requestsByType: [],
    requestsOverTime: [],
  })

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

      const { data: profileData } = await getProfileRole(user.id)

      if (!profileData) {
        router.push('/login')
        return
      }

      if ((profileData as { role: string }).role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData as any)
      await loadDashboardData()
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadDashboardData() {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'user')

      const { data: pendingRequests } = await supabase
        .from('waste_requests')
        .select('id')
        .eq('status', 'pending')

      const { data: activeCollections } = await supabase
        .from('collections')
        .select('id')
        .in('status', ['scheduled', 'in_progress'])

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id')

      setStats({
        totalUsers: users?.length || 0,
        pendingRequests: pendingRequests?.length || 0,
        activeCollections: activeCollections?.length || 0,
        totalVehicles: vehicles?.length || 0,
      })

      const { data: requests } = await supabase
        .from('waste_requests')
        .select('*, profiles:user_id(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentRequests(requests || [])

      // Prepare chart data
      await loadChartData()
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  async function loadChartData() {
    try {
      // Get all requests for charts
      const { data: allRequests } = await supabase
        .from('waste_requests')
        .select('status, waste_type, created_at')

      if (!allRequests) return

      // Requests by Status
      const statusCounts = allRequests.reduce((acc: any, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1
        return acc
      }, {})

      const requestsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number
      }))

      // Requests by Waste Type
      const typeCounts = allRequests.reduce((acc: any, req) => {
        acc[req.waste_type] = (acc[req.waste_type] || 0) + 1
        return acc
      }, {})

      const requestsByType = Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value: value as number
      }))

      // Requests Over Time (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })

      const requestsOverTime = last7Days.map(date => {
        const count = allRequests.filter(req => 
          req.created_at.startsWith(date)
        ).length
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        }
      })

      setChartData({
        requestsByStatus,
        requestsByType,
        requestsOverTime,
      })
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
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
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BrandLogo compact admin />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {profile.name}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Collections</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeCollections}</div>
              <p className="text-xs text-muted-foreground mt-1">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground mt-1">Total fleet</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Recent Collection Requests</CardTitle>
                <CardDescription>Latest requests from users</CardDescription>
              </div>
              <Link href="/admin/requests">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{request.waste_type}</p>
                      <p className="text-sm text-gray-600">
                        {request.profiles?.name || 'Unknown'} • {request.quantity} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                      <Link href={`/admin/requests/${request.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link href="/admin/requests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Package className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Manage Requests</CardTitle>
                <CardDescription>Review and approve</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/collections">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <List className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle className="text-lg">Collections</CardTitle>
                <CardDescription>Track & update status</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/vehicles">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Truck className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Vehicles</CardTitle>
                <CardDescription>Fleet management</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/drivers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Drivers</CardTitle>
                <CardDescription>Driver assignments</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/categories">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Package className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Categories</CardTitle>
                <CardDescription>Waste types</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Charts */}
        <AdminCharts data={chartData} />
      </main>
    </div>
  )
}
