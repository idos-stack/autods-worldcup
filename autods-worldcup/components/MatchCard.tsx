'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction } from '@/lib/types'
import { isPredictionOpen, flagUrl, formatMatchDate, formatMatchTime, formatCountdown, msUntilDeadline } from '@/lib/utils'
import clsx from 'clsx'

type Props = {
  match: Match
  prediction: Prediction | null
  userId: string
  isKnockout?: boolean
}

export default function MatchCard({ match, prediction: initialPrediction, userId, isKnockout }: Props) {
  const supabase = createClient()
  const [prediction, setPrediction] = useState(initialPrediction)
  const [homeScore, setHomeScore]   = useState<string>(initialPrediction?.predicted_home?.toString() ?? '')
  const [awayScore, setAwayScore]   = useState<string>(initialPrediction?.predicted_away?.toString() ?? '')
  const [winner,    setWinner]      = useState<string>(initialPrediction?.predicted_winner ?? '')
  const [saving,    setSaving]      = useState(false)
  const [saved,     setSaved]       = useState(false)
  const [countdown, setCountdown]   = useState(msUntilDeadline(match))
  const isOpen = isPredictionOpen(match)

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return
    const iv = setInterval(() => setCountdown(msUntilDeadline(match)), 1000)
    return () => clearInterval(iv)
  }, [match, isOpen])

  // Auto-save with debounce
  const autoSave = useCallback(async (home: string, away: string, win: string) => {
    if (!isOpen) return
    const h = parseInt(home), a = parseInt(away)
    if (isNaN(h) || isNaN(a)) return
    if (h < 0 || a < 0 || h > 30 || a > 30) return

    setSaving(true)
    const payload = {
      user_id: userId,
      match_id: match.id,
      predicted_home: h,
      predicted_away: a,
      predicted_winner: win || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('predictions')
      .upsert(payload, { onConflict: 'user_id,match_id' })
      .select()
      .single()

    if (!error && data) {
      setPrediction(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
    setSaving(false)
  }, [isOpen, userId, match.id, supabase])

  // Debounce save on input change
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => autoSave(homeScore, awayScore, winner), 600)
    return () => clearTimeout(t)
  }, [homeScore, awayScore, winner, autoSave, isOpen])

  const isFinished = match.status === 'FINISHED'
  const hasResult  = isFinished && match.home_score !== null && match.away_score !== null

  // Did we get points?
  const earned = prediction?.points_total ?? 0
  const wasScored = prediction?.scored

  // Knockout with unknown teams
  const isUnknown = isKnockout && (!match.home_team_code || !match.away_team_code)

  // Card state class
  const cardClass = !isOpen && !isFinished
    ? 'card-locked'
    : isFinished && wasScored
      ? earned > 0 ? 'card-correct' : 'card-wrong'
      : isOpen
        ? 'card-open'
        : 'card-locked'

  if (isUnknown) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">{formatMatchDate(match.kickoff_time)} · {formatMatchTime(match.kickoff_time)} IST</span>
        </div>
        <div className="text-center py-3">
          <p className="text-sm text-gray-400 italic">
            🔒 This fixture will open for predictions once both sides are confirmed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-xl p-4 transition-all', cardClass)}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          {formatMatchDate(match.kickoff_time)} · {formatMatchTime(match.kickoff_time)} IST
        </span>
        <div className="flex items-center gap-2">
          {isOpen && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ⏱ {formatCountdown(countdown)}
            </span>
          )}
          {!isOpen && !isFinished && (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Deadline passed</span>
          )}
          {saving && <span className="text-xs text-gray-400">saving…</span>}
          {saved  && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
          {wasScored && (
            <span className={clsx(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              earned > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
            )}>
              {earned > 0 ? `+${earned} pts` : '0 pts'}
            </span>
          )}
        </div>
      </div>

      {/* Teams + score input */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.home_team_code && (
            <Image src={flagUrl(match.home_team_code)} alt={match.home_team_name ?? ''} width={28} height={20} className="rounded-sm shrink-0" unoptimized />
          )}
          <span className="text-sm font-semibold truncate">{match.home_team_name ?? '?'}</span>
        </div>

        {/* Score inputs */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number" min="0" max="30"
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            disabled={!isOpen}
            className="score-input"
            placeholder="—"
          />
          <span className="text-gray-400 font-bold text-sm">:</span>
          <input
            type="number" min="0" max="30"
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            disabled={!isOpen}
            className="score-input"
            placeholder="—"
          />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-semibold truncate text-right">{match.away_team_name ?? '?'}</span>
          {match.away_team_code && (
            <Image src={flagUrl(match.away_team_code)} alt={match.away_team_name ?? ''} width={28} height={20} className="rounded-sm shrink-0" unoptimized />
          )}
        </div>
      </div>

      {/* Actual result (shown after match finished) */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Full-time result</span>
          <span className="text-sm font-bold text-brand-navy">
            {match.home_score} – {match.away_score}
            {match.home_score_et !== null && (
              <span className="text-xs text-gray-400 ml-1">(AET: {match.home_score_et}–{match.away_score_et})</span>
            )}
          </span>
        </div>
      )}

      {/* Knockout: who advances */}
      {isKnockout && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2 font-medium">Who will advance? (+10 pts)</p>
          <div className="flex gap-2">
            {[
              { code: match.home_team_code, name: match.home_team_name },
              { code: match.away_team_code, name: match.away_team_name },
            ].map(team => (
              <button
                key={team.code}
                onClick={() => isOpen && setWinner(winner === team.code ? '' : team.code!)}
                disabled={!isOpen}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-semibold transition-all',
                  winner === team.code
                    ? 'border-brand-orange bg-brand-orange text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  !isOpen && 'opacity-60 cursor-not-allowed'
                )}
              >
                {team.code && (
                  <Image src={flagUrl(team.code, 'w20')} alt={team.name ?? ''} width={16} height={11} className="rounded-sm" unoptimized />
                )}
                <span className="truncate text-xs">{team.name}</span>
              </button>
            ))}
          </div>
          {/* Show actual winner after result */}
          {hasResult && match.winner_code && (
            <p className="text-xs text-gray-400 mt-2">
              Advanced: <span className="font-semibold text-brand-navy">
                {match.winner_code === match.home_team_code ? match.home_team_name : match.away_team_name}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
