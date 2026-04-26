'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const TABS = [
  { href: '/predictions', label: 'My Guesses', icon: '⚽' },
  { href: '/leaderboard', label: 'Standings',  icon: '🏆' },
  { href: '/rules',       label: 'Rules',      icon: '📋' },
]

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="shrink-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href} href={tab.href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors',
                active ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
              {active && <span className="w-5 h-0.5 bg-brand-orange rounded-full mt-0.5" />}
            </Link>
          )
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors',
              pathname.startsWith('/admin') ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <span className="text-xl">🔧</span>
            <span>Admin</span>
            {pathname.startsWith('/admin') && <span className="w-5 h-0.5 bg-brand-orange rounded-full mt-0.5" />}
          </Link>
        )}
      </div>
    </nav>
  )
}
