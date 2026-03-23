'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

function extractErrorDetails(error: unknown): { message: string; status?: number } {
  if (typeof error === 'object' && error !== null) {
    const messageValue = 'message' in error ? (error as { message?: unknown }).message : undefined
    const statusValue = 'status' in error ? (error as { status?: unknown }).status : undefined

    const message =
      typeof messageValue === 'string' && messageValue.length > 0
        ? messageValue
        : error instanceof Error
          ? error.message
          : 'Failed to create account'

    return {
      message,
      status: typeof statusValue === 'number' ? statusValue : undefined,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: 'Failed to create account' }
}

function isRateLimitError(message: string, status?: number): boolean {
  if (status === 429) return true

  const lowerMessage = message.toLowerCase()
  return lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = window.setInterval(() => {
      setCooldownSeconds((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cooldownSeconds > 0) {
      toast({
        title: 'Please wait',
        description: `Too many signup attempts. Try again in ${cooldownSeconds}s.`,
        variant: 'destructive',
      })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Sign up user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })

      if (error) throw error

      // Create profile immediately only when a session exists.
      // If email confirmation is enabled, profile is created on first successful login.
      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: formData.name,
            role: 'user',
          }, { onConflict: 'id' })

        if (profileError) throw profileError
      }

      if (!data.session) {
        toast({
          title: 'Check your email',
          description: 'Account created. Verify your email, then sign in.',
        })
        router.push('/login')
      } else {
        toast({
          title: 'Success',
          description: 'Account created successfully',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      const { message, status } = extractErrorDetails(error)

      if (isRateLimitError(message, status)) {
        setCooldownSeconds(60)
        toast({
          title: 'Too many attempts',
          description: 'Signup rate limit reached. Please wait 60 seconds and try again.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Error',
        description: message,
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
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join EcoLoop to manage your waste collection
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading || cooldownSeconds > 0}>
              {loading ? 'Creating account...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
