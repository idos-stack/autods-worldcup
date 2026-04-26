'use client'

import { useState } from 'react'
import type { Match, Prediction, WildcardQuestion, WildcardAnswer, WildcardResult } from '@/lib/types'
import { STAGE_LABELS } from '@/lib/constants'
import MatchCard from './MatchCard'
import WildcardSection from './WildcardSection'

type Props = {
  userId: string
  matches: Match[]
  predMap: Record<string, Prediction>
  wildcardQuestions: WildcardQuestion[]
  wcAnswerMap: Record<number, WildcardAnswer>
  wcResultMap: Record<number, WildcardResult>
}

// Determine deadline for wildcards = kickoff of first match - 5 min
function getWildcardDeadline(matches: Match[]): Date | null {
  if (!matches.length) return null
  const sorted = [...matches].sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
  const first = new Date(sorted[0].kickoff_time)
  return new Date(first.getTime() - 5 * 60 * 1000)
}

type Tab = 'wildcards' | 'group' | 'knockout'

export default function PredictionsClient({ userId, matches, predMap, wildcardQuestions, wcAnswerMap, wcResultMap }: Props) {
  const [tab, setTab] = useState<Tab>('wildcards')

  const wildcardDeadline = getWildcardDeadline(matches)
  const wildcardOpen = wildcardDeadline ? Date.now() < wildcardDeadline.getTime() : true

  const groupMatches    = matches.filter(m => m.stage === 'GROUP')
  const knockoutMatches = matches.filter(m => m.stage !== 'GROUP')

  // Group matches by group name / stage
  const groupByGroup = groupMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.group_name ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const knockoutByStage = knockoutMatches.reduce<Record<string, Match[]>>((acc, m) => {
    const key = m.stage
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const stageOrder = ['ROUND_OF_32','ROUND_OF_16','QUARTER_FINAL','SEMI_FINAL','THIRD_PLACE','FINAL']

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div className="flex bg-gray-100 border-b border-gray-200 shrink-0">
        {([
          { key: 'wildcards', label: '🎯 Wild Cards' },
          { key: 'group',     label: '⚽ Group Stage' },
          { key: 'knockout',  label: '🥊 Knockout' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'text-brand-orange border-b-2 border-brand-orange bg-white'
                : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {tab === 'wildcards' && (
          <div className="p-4 space-y-3">
            <WildcardSection
              userId={userId}
              questions={wildcardQuestions}
              answerMap={wcAnswerMap}
              resultMap={wcResultMap}
              isOpen={wildcardOpen}
              deadline={wildcardDeadline}
            />
          </div>
        )}

        {tab === 'group' && (
          <div className="p-4 space-y-6">
            {Object.keys(groupByGroup).sort().map(groupName => (
              <div key={groupName}>
                <h3 className="text-sm font-bold text-brand-navy mb-2 flex items-center gap-2">
                  <span className="bg-brand-navy text-white text-xs px-2 py-0.5 rounded">
                    Group {groupName}
                  </span>
                </h3>
                <div className="space-y-2">
                  {groupByGroup[groupName].map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predMap[match.id] ?? null}
                      userId={userId}
                    />
                  ))}
                </div>
              </div>
            ))}
            {groupMatches.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">
                Group stage fixtures will appear here once the tournament begins.
              </p>
            )}
          </div>
        )}

        {tab === 'knockout' && (
          <div className="p-4 space-y-6">
            {stageOrder.map(stage => {
              const stageMatches = knockoutByStage[stage]
              if (!stageMatches?.length) return null
              return (
                <div key={stage}>
                  <h3 className="text-sm font-bold text-brand-navy mb-2">
                    {STAGE_LABELS[stage] ?? stage}
                  </h3>
                  <div className="space-y-2">
                    {stageMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={predMap[match.id] ?? null}
                        userId={userId}
                        isKnockout
                      />
                    ))}
                  </div>
                </div>
              )
            })}
            {knockoutMatches.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-3xl mb-3">🥊</p>
                <p className="text-gray-500 text-sm font-medium">Knockout fixtures coming soon</p>
                <p className="text-gray-400 text-xs mt-1">
                  Matches will open for predictions as soon as both sides are confirmed.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
