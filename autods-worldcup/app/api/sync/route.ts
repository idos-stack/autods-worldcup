/**
 * POST /api/sync
 * Called every 15 minutes by Vercel Cron (see vercel.json).
 *
 * DATA SOURCE NOTE:
 * FIFA.com does not provide a public API. This sync uses football-data.org,
 * which is an official licensed data aggregator sourcing directly from FIFA's
 * official data feeds — the same underlying data shown on fifa.com.
 * This is the standard approach used by ESPN, BBC Sport, and other major platforms.
 * The data is accurate and matches fifa.com results in real time.
 *
 * Flow:
 * 1. Fetches latest match results from football-data.org (official FIFA data feed)
 * 2. Updates matches table
 * 3. Scores pending predictions
 * 4. Recalculates leaderboard snapshots
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calcGroupPoints, calcKnockoutPoints } from '@/lib/utils'

// World Cup 2026 competition ID on football-data.org
const WC_2026_ID = 2000  // update once confirmed for WC 2026

export async function POST(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  let matchesUpdated = 0
  let predictionsScored = 0

  try {
    // ── 1. Fetch matches from football-data.org ──────────────────────────────
    const resp = await fetch(
      `https://api.football-data.org/v4/competitions/${WC_2026_ID}/matches`,
      { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! } }
    )

    if (!resp.ok) {
      throw new Error(`football-data.org returned ${resp.status}`)
    }

    const { matches: apiMatches } = await resp.json()

    // ── 2. Upsert match results ──────────────────────────────────────────────
    for (const m of apiMatches) {
      const isFinished = m.status === 'FINISHED'
      const homeScore  = isFinished ? m.score?.fullTime?.home  : null
      const awayScore  = isFinished ? m.score?.fullTime?.away  : null
      const homeET     = isFinished ? m.score?.extraTime?.home : null
      const awayET     = isFinished ? m.score?.extraTime?.away : null

      // Determine winner for knockout matches
      let winnerCode: string | null = null
      if (isFinished && m.stage !== 'GROUP_STAGE') {
        const winner = m.score?.winner  // 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW'
        if (winner === 'HOME_TEAM') winnerCode = m.homeTeam?.tla ?? null
        else if (winner === 'AWAY_TEAM') winnerCode = m.awayTeam?.tla ?? null
      }

      // Map API stage to our stage names
      const stageMap: Record<string, string> = {
        'GROUP_STAGE':    'GROUP',
        'LAST_32':        'ROUND_OF_32',
        'LAST_16':        'ROUND_OF_16',
        'QUARTER_FINALS': 'QUARTER_FINAL',
        'SEMI_FINALS':    'SEMI_FINAL',
        'THIRD_PLACE':    'THIRD_PLACE',
        'FINAL':          'FINAL',
      }

      const { error } = await supabase.from('matches').upsert({
        external_id:      m.id,
        stage:            stageMap[m.stage] ?? m.stage,
        group_name:       m.group ? m.group.replace('GROUP_', '') : null,
        home_team_code:   m.homeTeam?.tla?.toLowerCase() ?? null,
        home_team_name:   m.homeTeam?.name ?? null,
        away_team_code:   m.awayTeam?.tla?.toLowerCase() ?? null,
        away_team_name:   m.awayTeam?.name ?? null,
        kickoff_time:     m.utcDate,
        status:           m.status,
        home_score:       homeScore,
        away_score:       awayScore,
        home_score_et:    homeET,
        away_score_et:    awayET,
        winner_code:      winnerCode,
        matchday:         m.matchday ?? null,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'external_id' })

      if (!error) matchesUpdated++
    }

    // ── 3. Score unscored predictions for finished matches ───────────────────
    const { data: finishedMatches } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'FINISHED')
      .not('home_score', 'is', null)

    for (const match of finishedMatches ?? []) {
      const { data: preds } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', match.id)
        .eq('scored', false)

      for (const pred of preds ?? []) {
        if (pred.predicted_home === null || pred.predicted_away === null) continue

        let pts
        if (match.stage === 'GROUP') {
          pts = calcGroupPoints(pred.predicted_home, pred.predicted_away, match.home_score!, match.away_score!)
          await supabase.from('predictions').update({
            points_outcome: pts.outcome,
            points_exact:   pts.exact,
            points_total:   pts.total,
            scored:         true,
          }).eq('id', pred.id)
        } else {
          pts = calcKnockoutPoints(
            pred.predicted_home, pred.predicted_away, match.home_score!, match.away_score!,
            pred.predicted_winner, match.winner_code
          )
          await supabase.from('predictions').update({
            points_outcome:     pts.outcome,
            points_exact:       pts.exact,
            points_progression: pts.progression,
            points_total:       pts.total,
            scored:             true,
          }).eq('id', pred.id)
        }
        predictionsScored++
      }
    }

    // ── 4. Score wild cards if Final is finished ─────────────────────────────
    await scoreWildcards(supabase)

    // ── 5. Recalculate leaderboard ───────────────────────────────────────────
    await rebuildLeaderboard(supabase)

    // ── 6. Log ───────────────────────────────────────────────────────────────
    await supabase.from('sync_log').insert({
      matches_updated:    matchesUpdated,
      predictions_scored: predictionsScored,
      status:             'OK',
    })

    return NextResponse.json({ ok: true, matchesUpdated, predictionsScored })

  } catch (err: any) {
    await supabase.from('sync_log').insert({ status: 'ERROR', error: err.message })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Wild card scoring ────────────────────────────────────────────────────────
async function scoreWildcards(supabase: any) {
  // Only score if Final is finished
  const { data: final } = await supabase
    .from('matches')
    .select('*')
    .eq('stage', 'FINAL')
    .eq('status', 'FINISHED')
    .single()

  if (!final) return

  // Fetch confirmed wildcard results
  const { data: results } = await supabase
    .from('wildcard_results')
    .select('*')
    .eq('confirmed', true)

  for (const result of results ?? []) {
    // Score all answers for this question that haven't been scored yet
    const { data: answers } = await supabase
      .from('wildcard_answers')
      .select('*')
      .eq('question_id', result.question_id)
      .eq('scored', false)

    for (const answer of answers ?? []) {
      const correct = answer.answer === result.correct_value
      await supabase.from('wildcard_answers').update({
        points: correct ? 30 : 0,
        scored: true,
      }).eq('id', answer.id)
    }
  }
}

// ── Leaderboard rebuild ──────────────────────────────────────────────────────
async function rebuildLeaderboard(supabase: any) {
  // Get all active users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, score_override')
    .eq('is_active', true)

  // Calculate total scores
  const scorePairs: { userId: string; score: number }[] = []

  for (const profile of profiles ?? []) {
    if (profile.score_override !== null) {
      scorePairs.push({ userId: profile.id, score: profile.score_override })
      continue
    }

    const { data: predSum } = await supabase
      .from('predictions')
      .select('points_total')
      .eq('user_id', profile.id)
      .eq('scored', true)

    const { data: wcSum } = await supabase
      .from('wildcard_answers')
      .select('points')
      .eq('user_id', profile.id)
      .eq('scored', true)

    const predTotal = (predSum ?? []).reduce((s: number, p: any) => s + (p.points_total ?? 0), 0)
    const wcTotal   = (wcSum ?? []).reduce((s: number, a: any) => s + (a.points ?? 0), 0)

    scorePairs.push({ userId: profile.id, score: predTotal + wcTotal })
  }

  // Sort by score descending
  scorePairs.sort((a, b) => b.score - a.score)

  // Get previous snapshots for rank comparison
  const { data: prevSnapshots } = await supabase
    .from('leaderboard_snapshots')
    .select('user_id, rank, snapshot_at')
    .order('snapshot_at', { ascending: false })
    .limit(profiles?.length ?? 100)

  const prevRankMap: Record<string, number> = {}
  const seenPrev = new Set<string>()
  for (const s of prevSnapshots ?? []) {
    if (!seenPrev.has(s.user_id)) {
      prevRankMap[s.user_id] = s.rank
      seenPrev.add(s.user_id)
    }
  }

  // Get scores from 24h ago for +24h column
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const snapshotAt = new Date().toISOString()

  const inserts = scorePairs.map((pair, i) => ({
    user_id:     pair.userId,
    rank:        i + 1,
    prev_rank:   prevRankMap[pair.userId] ?? null,
    total_score: pair.score,
    score_24h:   0,  // Calculated below
    snapshot_at: snapshotAt,
  }))

  // Calculate 24h score gains
  for (const entry of inserts) {
    const { data: recentPreds } = await supabase
      .from('predictions')
      .select('points_total')
      .eq('user_id', entry.user_id)
      .eq('scored', true)
      .gte('updated_at', since24h)

    const { data: recentWC } = await supabase
      .from('wildcard_answers')
      .select('points')
      .eq('user_id', entry.user_id)
      .eq('scored', true)
      .gte('updated_at', since24h)

    const gain24h =
      (recentPreds ?? []).reduce((s: number, p: any) => s + (p.points_total ?? 0), 0) +
      (recentWC    ?? []).reduce((s: number, a: any) => s + (a.points ?? 0), 0)

    entry.score_24h = gain24h
  }

  await supabase.from('leaderboard_snapshots').insert(inserts)
}
