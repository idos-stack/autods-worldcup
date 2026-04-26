import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { flagUrl } from '@/lib/utils'
import clsx from 'clsx'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Latest snapshot per user
  const { data: snapshots } = await supabase
    .from('leaderboard_snapshots')
    .select(`
      user_id, rank, prev_rank, total_score, score_24h, snapshot_at,
      profiles (full_name, nickname, home_country, home_country_name, is_active)
    `)
    .order('rank', { ascending: true })
    .limit(200)

  // Filter only active users and deduplicate (latest per user)
  const seen = new Set<string>()
  const entries = (snapshots ?? []).filter(s => {
    const profile = s.profiles as any
    if (!profile?.is_active) return false
    if (seen.has(s.user_id)) return false
    seen.add(s.user_id)
    return true
  })

  const lastSync = entries[0]?.snapshot_at
    ? new Date(entries[0].snapshot_at).toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit'
      }) + ' IST'
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="bg-brand-navy text-white px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">🏆 Standings</h2>
          {lastSync && <p className="text-xs text-gray-400">Updated {lastSync}</p>}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">Refreshes every 15 minutes</p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">🏁</p>
            <p className="text-sm">No standings yet — check back once the tournament begins!</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            {/* Sticky header */}
            <thead className="lb-header bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 w-10">#</th>
                <th className="px-1 py-2.5 text-left text-xs font-bold text-gray-500 w-8">🏳</th>
                <th className="px-2 py-2.5 text-left text-xs font-bold text-gray-500">Name</th>
                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-500 w-14">Score</th>
                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-500 w-14">+24h</th>
                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-500 w-10">Prev</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const profile = entry.profiles as any
                const isMe    = entry.user_id === user?.id
                const movement = entry.prev_rank != null ? entry.prev_rank - entry.rank : null

                return (
                  <tr
                    key={entry.user_id}
                    className={clsx(
                      'border-b border-gray-100 transition-colors',
                      isMe ? 'bg-brand-orange/5' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    {/* Rank */}
                    <td className="px-3 py-3">
                      <span className={clsx(
                        'text-sm font-bold',
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-amber-600' : 'text-gray-600'
                      )}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </span>
                    </td>
                    {/* Flag */}
                    <td className="px-1 py-3">
                      {profile?.home_country && (
                        <Image
                          src={flagUrl(profile.home_country, 'w20')}
                          alt={profile.home_country_name ?? ''}
                          width={20} height={14} className="rounded-sm" unoptimized
                        />
                      )}
                    </td>
                    {/* Name */}
                    <td className="px-2 py-3 max-w-[120px]">
                      <p className={clsx('font-semibold truncate', isMe && 'text-brand-orange')}>
                        {profile?.nickname ?? profile?.full_name ?? 'Unknown'}
                        {isMe && <span className="text-xs ml-1 text-brand-orange/70">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{profile?.full_name}</p>
                    </td>
                    {/* Score */}
                    <td className="px-2 py-3 text-right font-bold text-brand-navy">
                      {entry.total_score}
                    </td>
                    {/* +24h */}
                    <td className="px-2 py-3 text-right">
                      {entry.score_24h > 0
                        ? <span className="text-green-600 font-semibold text-xs">+{entry.score_24h}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    {/* Movement */}
                    <td className="px-2 py-3 text-right">
                      {movement === null ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : movement > 0 ? (
                        <span className="text-green-500 text-xs font-bold">▲{movement}</span>
                      ) : movement < 0 ? (
                        <span className="text-red-400 text-xs font-bold">▼{Math.abs(movement)}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
