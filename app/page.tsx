import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Leaf, Route, ShieldCheck } from 'lucide-react'
import { SiteNavbar } from '@/components/site-navbar'
import { SiteFooter } from '@/components/site-footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteNavbar />

      <main>
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute -left-20 top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 top-16 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Civic Waste Intelligence Platform
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Transform Waste Pickup Into a Predictable, Smart Service
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                EcoLoop helps citizens raise requests, helps teams route vehicles efficiently, and helps administrators monitor city-wide cleanliness with real-time analytics.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg">Create Account</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">Open Dashboard</Button>
                </Link>
              </div>
            </div>

            <Card className="border-border/70 bg-card/90 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Operations Snapshot</CardTitle>
                <CardDescription>Live-style mock indicators for demonstration</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-emerald-500/10 p-4">
                  <p className="text-xs text-muted-foreground">Pickup SLA</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">96%</p>
                </div>
                <div className="rounded-lg bg-cyan-500/10 p-4">
                  <p className="text-xs text-muted-foreground">Active Routes</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-600">42</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-4">
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600">18</p>
                </div>
                <div className="rounded-lg bg-indigo-500/10 p-4">
                  <p className="text-xs text-muted-foreground">Recycling Rate</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-600">71%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="solutions" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Built for Every Waste Workflow</h2>
            <p className="max-w-sm text-right text-sm text-muted-foreground">From household pickups to municipal control rooms.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Leaf className="mb-2 h-10 w-10 text-emerald-600" />
                <CardTitle>Citizen Requests</CardTitle>
                <CardDescription>Residents can raise structured pickup tickets in seconds.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Route className="mb-2 h-10 w-10 text-cyan-600" />
                <CardTitle>Route Efficiency</CardTitle>
                <CardDescription>Operational teams can optimize routes and reduce idle time.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <AreaChart className="mb-2 h-10 w-10 text-indigo-600" />
                <CardTitle>Actionable Analytics</CardTitle>
                <CardDescription>Charts and trends show what needs attention across zones.</CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <ShieldCheck className="mb-2 h-10 w-10 text-amber-600" />
                <CardTitle>Admin Governance</CardTitle>
                <CardDescription>Role-based control keeps approvals and operations auditable.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section id="workflow" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-border/70 bg-card/90">
            <CardContent className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step 1</p>
                <h3 className="mt-2 text-lg font-semibold">Raise Request</h3>
                <p className="mt-2 text-sm text-muted-foreground">Users submit pickup type, quantity, and location.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step 2</p>
                <h3 className="mt-2 text-lg font-semibold">Dispatch Team</h3>
                <p className="mt-2 text-sm text-muted-foreground">Admins assign drivers and vehicles to approved requests.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Step 3</p>
                <h3 className="mt-2 text-lg font-semibold">Track Outcomes</h3>
                <p className="mt-2 text-sm text-muted-foreground">Completion status and performance metrics update in real-time.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="impact" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <Card className="border-0 bg-gradient-to-br from-emerald-600 to-cyan-600 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">Scale Cleanliness Across the City</CardTitle>
              <CardDescription className="text-emerald-50">
                Deploy one shared platform for citizens, drivers, and administrators.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <p className="max-w-xl text-sm text-emerald-50/90">
                EcoLoop helps local bodies reduce delays, improve recycling rates, and maintain transparent service delivery.
              </p>
              <div className="flex gap-3">
                <Link href="/register">
                  <Button variant="secondary" size="lg">Get Started</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                    Open Console
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
