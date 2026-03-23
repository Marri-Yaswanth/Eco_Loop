import Link from 'next/link'
import { Recycle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  href?: string
  compact?: boolean
  admin?: boolean
}

export function BrandLogo({ className, href = '/', compact = false, admin = false }: BrandLogoProps) {
  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25">
        <Recycle className="h-5 w-5" />
        <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-emerald-500" />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-bold tracking-tight text-foreground">EcoLoop</p>
          <p className="text-xs text-muted-foreground">{admin ? 'Admin Control Hub' : 'Smart Waste Operations'}</p>
        </div>
      )}
    </div>
  )

  if (!href) return content

  return (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  )
}
