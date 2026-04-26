import Image from 'next/image'
import { flagUrl } from '@/lib/utils'

type Props = {
  profile: {
    full_name: string | null
    nickname: string | null
    home_country: string | null
    is_admin: boolean
  }
}

export default function TopBar({ profile }: Props) {
  return (
    <header className="bg-brand-navy text-white px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-brand-orange font-black text-lg leading-none">AutoDS</span>
        <span className="text-white font-bold text-sm leading-none">WC 2026</span>
        <span className="text-lg">🏆</span>
      </div>
      <div className="flex items-center gap-2">
        {profile.home_country && (
          <Image
            src={flagUrl(profile.home_country, 'w20')}
            alt={profile.home_country}
            width={20} height={14}
            className="rounded-sm"
            unoptimized
          />
        )}
        <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
          {profile.nickname ?? profile.full_name}
        </span>
        {profile.is_admin && (
          <span className="text-xs bg-brand-orange px-1.5 py-0.5 rounded font-bold">ADMIN</span>
        )}
      </div>
    </header>
  )
}
