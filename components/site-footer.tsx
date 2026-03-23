import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h3 className="text-base font-semibold">EcoLoop</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Digital operations platform for cleaner neighborhoods and smarter waste routing.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Citizen Requests</li>
            <li>Driver Dispatch</li>
            <li>Analytics</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
            <li><Link href="/register" className="hover:text-foreground">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <p className="mt-3 text-sm text-muted-foreground">support@ecoloop.app</p>
          <p className="text-sm text-muted-foreground">+91 90000 00000</p>
        </div>
      </div>
      <div className="border-t border-border/60 px-4 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} EcoLoop. Built for sustainable city operations.
      </div>
    </footer>
  )
}
