import { DEADLINE_MINUTES } from './constants'
import type { Match } from './types'

/** Returns true if the prediction window for this match is still open */
export function isPredictionOpen(match: Match): boolean {
  if (match.status === 'FINISHED') return false
  const deadline = new Date(match.kickoff_time).getTime() - DEADLINE_MINUTES * 60 * 1000
  return Date.now() < deadline
}

/** Returns ms until deadline (negative = past deadline) */
export function msUntilDeadline(match: Match): number {
  const deadline = new Date(match.kickoff_time).getTime() - DEADLINE_MINUTES * 60 * 1000
  return deadline - Date.now()
}

/** Format countdown as "Xh Ym" or "Xm" */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Closed'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Is this a knockout stage match? */
export function isKnockout(match: Match): boolean {
  return match.stage !== 'GROUP'
}

/** Both teams must be known to open a knockout fixture */
export function isKnockoutReady(match: Match): boolean {
  return !!(match.home_team_code && match.away_team_code)
}

/** Flag URL via flagcdn.com */
export function flagUrl(code: string, size: 'w20' | 'w40' | 'w80' = 'w40'): string {
  return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`
}

/** Determine 90-min result: 'HOME' | 'AWAY' | 'DRAW' */
export function getResult(homeScore: number, awayScore: number): 'HOME' | 'AWAY' | 'DRAW' {
  if (homeScore > awayScore) return 'HOME'
  if (awayScore > homeScore) return 'AWAY'
  return 'DRAW'
}

/** Calculate group stage points for a prediction */
export function calcGroupPoints(
  predictedHome: number, predictedAway: number,
  actualHome: number, actualAway: number
): { outcome: number; exact: number; total: number } {
  const predResult = getResult(predictedHome, predictedAway)
  const actualResult = getResult(actualHome, actualAway)
  const outcome = predResult === actualResult ? 5 : 0
  const exact = predictedHome === actualHome && predictedAway === actualAway ? 5 : 0
  return { outcome, exact, total: outcome + exact }
}

/** Calculate knockout stage points for a prediction */
export function calcKnockoutPoints(
  predictedHome: number, predictedAway: number,
  actualHome: number, actualAway: number,
  predictedWinner: string | null, actualWinner: string | null
): { outcome: number; exact: number; progression: number; total: number } {
  const predResult = getResult(predictedHome, predictedAway)
  const actualResult = getResult(actualHome, actualAway)
  const outcome = predResult === actualResult ? 10 : 0
  const exact = predictedHome === actualHome && predictedAway === actualAway ? 5 : 0
  const progression = (predictedWinner && actualWinner && predictedWinner === actualWinner) ? 10 : 0
  return { outcome, exact, progression, total: outcome + exact + progression }
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/** Format date for display in Israel timezone */
export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Jerusalem',
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function formatMatchTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit', minute: '2-digit',
  })
}
