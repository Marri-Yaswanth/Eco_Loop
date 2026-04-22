'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ArrowLeft, Package, Search, Filter, CheckCircle, XCircle } from 'lucide-react'

interface WasteRequest {
  id: string
  waste_type: string
  quantity: number
  pickup_date: string
  address: string
  status: string
  priority: string
  rejection_reason?: string | null
  created_at: string
  profiles: { name: string } | null
}

export default function AdminRequestsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<WasteRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<WasteRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [requestIdToReject, setRequestIdToReject] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter])

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

    await loadRequests()
  }

  async function loadRequests() {
    try {
      const { data, error } = await supabase
        .from('waste_requests')
        .select('*, profiles:user_id(name)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterRequests() {
    let filtered = requests

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.waste_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredRequests(filtered)
  }

  async function handleApprove(requestId: string) {
    try {
      const { error } = await supabase
        .from('waste_requests')
        .update({ status: 'approved', rejection_reason: null })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Request approved successfully',
      })

      await loadRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      })
    }
  }

  function openRejectDialog(requestId: string) {
    setRequestIdToReject(requestId)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  async function handleReject() {
    const reason = rejectionReason.trim()
    if (!requestIdToReject) {
      return
    }

    if (!reason) {
      toast({
        title: 'Reason required',
        description: 'Please enter a rejection reason for the user.',
        variant: 'destructive',
      })
      return
    }

    setRejecting(true)
    try {
      const { error } = await supabase
        .from('waste_requests')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', requestIdToReject)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Request rejected with feedback',
      })

      setRejectDialogOpen(false)
      setRequestIdToReject(null)
      setRejectionReason('')
      await loadRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      })
    } finally {
      setRejecting(false)
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
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Manage Collection Requests</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by waste type or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0
                  ? 'Requests will appear here when users submit them'
                  : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{request.waste_type}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <strong>User:</strong> {request.profiles?.name || 'Unknown'}
                        </div>
                        <div>
                          <strong>Quantity:</strong> {request.quantity} kg
                        </div>
                        <div>
                          <strong>Pickup Date:</strong> {new Date(request.pickup_date).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Submitted:</strong> {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">
                        <strong>Address:</strong> {request.address}
                      </p>

                      {request.status === 'rejected' && request.rejection_reason && (
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Feedback:</strong> {request.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(request.id)}
                            className="gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Link href={`/admin/requests/${request.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open)
          if (!open) {
            setRequestIdToReject(null)
            setRejectionReason('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Write feedback so the user understands why this collection request was rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Textarea
              placeholder="Example: The selected pickup date is unavailable. Please choose another date."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting}>
              {rejecting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
