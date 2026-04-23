'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { upsertProfile, getProfileRole } from '@/lib/supabase/queries'

export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return 'Failed to login'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      // Ensure a profile row exists for this user.
      const displayName =
        (typeof data.user.user_metadata?.name === 'string' && data.user.user_metadata.name.trim().length > 0
          ? data.user.user_metadata.name.trim()
          : data.user.email?.split('@')[0]) || 'User'

      const { error: profileUpsertError } = await upsertProfile({
        id: data.user.id,
        name: displayName,
      })

      if (profileUpsertError) throw profileUpsertError

      // Get user profile to determine role
      const { data: profile } = await getProfileRole(data.user.id)

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })

      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect based on role (admin > driver > user)
      const redirect = searchParams.get('redirect')
      if (redirect) {
        window.location.href = redirect
      } else {
        if (profile?.role === 'admin') {
          window.location.href = '/admin/dashboard'
          return
        }

        if (profile?.role === 'driver') {
          window.location.href = '/driver/dashboard'
          return
        }

        const { data: driverProfile } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        window.location.href = driverProfile ? '/driver/dashboard' : '/dashboard'
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome to EcoLoop</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
