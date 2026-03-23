import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <BrandLogo href="/" />

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#solutions" className="transition-colors hover:text-foreground">Solutions</a>
          <a href="#impact" className="transition-colors hover:text-foreground">Impact</a>
          <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Start Free</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
