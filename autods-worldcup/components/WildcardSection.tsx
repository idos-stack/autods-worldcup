'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WildcardQuestion, WildcardAnswer, WildcardResult } from '@/lib/types'
import { GOLDEN_BOOT_PLAYERS, TOP_ASSISTER_PLAYERS, WC_GROUPS } from '@/lib/constants'
import CountrySelect from './CountrySelect'
import { formatCountdown } from '@/lib/utils'
import clsx from 'clsx'

type Props = {
  userId: string
  questions: WildcardQuestion[]
  answerMap: Record<number, WildcardAnswer>
  resultMap: Record<number, WildcardResult>
  isOpen: boolean
  deadline: Date | null
}

export default function WildcardSection({ userId, questions, answerMap, resultMap, isOpen, deadline }: Props) {
  const [countdown, setCountdown] = useState(
    deadline ? deadline.getTime() - Date.now() : 0
  )

  useEffect(() => {
    if (!isOpen || !deadline) return
    const iv = setInterval(() => setCountdown(deadline.getTime() - Date.now()), 1000)
    return () => clearInterval(iv)
  }, [isOpen, deadline])

  return (
    <div>
      {/* Header */}
      <div className={clsx(
        'rounded-xl p-3 mb-4 flex items-center justify-between',
        isOpen ? 'bg-brand-orange/10 border border-brand-orange/30' : 'bg-gray-100 border border-gray-200'
      )}>
        <div>
          <p className="text-sm font-bold text-brand-navy">🎯 Wild Card Predictions</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOpen ? 'Lock in your tournament-wide predictions' : 'Deadline passed — predictions locked'}
          </p>
        </div>
        <div className="text-right shrink-0 ml-3">
          {isOpen && deadline && (
            <>
              <p className="text-xs text-gray-400">Closes in</p>
              <p className="text-sm font-bold text-brand-orange">{formatCountdown(countdown)}</p>
            </>
          )}
          {!isOpen && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-lg">Locked</span>}
        </div>
      </div>

      <div className="space-y-3">
        {questions.map(q => (
          <WildcardCard
            key={q.id}
            question={q}
            answer={answerMap[q.id] ?? null}
            result={resultMap[q.id] ?? null}
            userId={userId}
            isOpen={isOpen}
          />
        ))}
      </div>
    </div>
  )
}

function WildcardCard({
  question, answer: initialAnswer, result, userId, isOpen
}: {
  question: WildcardQuestion
  answer: WildcardAnswer | null
  result: WildcardResult | null
  userId: string
  isOpen: boolean
}) {
  const supabase = createClient()
  const [answer, setAnswer]     = useState(initialAnswer)
  const [value,  setValue]      = useState(initialAnswer?.answer ?? '')
  const [label,  setLabel]      = useState(initialAnswer?.answer_label ?? '')
  const [saving, setSaving]     = useState(false)
  const [saved,  setSaved]      = useState(false)

  const save = useCallback(async (v: string, l: string) => {
    if (!isOpen || !v) return
    setSaving(true)
    const { data, error } = await supabase
      .from('wildcard_answers')
      .upsert({
        user_id: userId,
        question_id: question.id,
        answer: v,
        answer_label: l,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,question_id' })
      .select()
      .single()
    if (!error && data) {
      setAnswer(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
    setSaving(false)
  }, [isOpen, userId, question.id, supabase])

  const handleChange = (v: string, l: string) => {
    setValue(v); setLabel(l)
    save(v, l)
  }

  // Points badge
  const isScored  = answer?.scored
  const pts       = answer?.points ?? 0
  const isCorrect = result?.confirmed && value === result.correct_value

  return (
    <div className={clsx(
      'bg-white border rounded-xl p-4',
      isScored && pts > 0 ? 'border-green-300 border-l-4 border-l-green-500' :
      isScored && pts === 0 ? 'border-red-200 border-l-4 border-l-red-400' :
      isOpen ? 'border-gray-200 border-l-4 border-l-brand-orange' :
      'border-gray-200 border-l-4 border-l-gray-300'
    )}>
      {/* Question */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{question.question}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {saving && <span className="text-xs text-gray-400">saving…</span>}
          {saved  && <span className="text-xs text-green-600">✓</span>}
          {isScored ? (
            <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
              pts > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
            )}>
              {pts > 0 ? `+${pts} pts` : '0 pts'}
            </span>
          ) : (
            <span className="text-xs bg-brand-orange/10 text-brand-orange font-bold px-2 py-0.5 rounded-full">30 pts</span>
          )}
        </div>
      </div>

      {/* Input */}
      <WildcardInput
        type={question.answer_type}
        value={value}
        label={label}
        onChange={handleChange}
        disabled={!isOpen}
      />

      {/* Reveal result after tournament */}
      {result?.confirmed && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Correct answer</span>
          <span className={clsx('text-xs font-bold', isCorrect ? 'text-green-600' : 'text-red-500')}>
            {result.correct_label}
            {isCorrect ? ' ✓' : ` (you: ${label || '—'})`}
          </span>
        </div>
      )}
    </div>
  )
}

function WildcardInput({
  type, value, label, onChange, disabled
}: {
  type: string; value: string; label: string
  onChange: (value: string, label: string) => void
  disabled: boolean
}) {
  const base = clsx(
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-orange',
    disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed'
  )

  if (type === 'COUNTRY') {
    return (
      <CountrySelect
        value={value ? { code: value, name: label } : null}
        onChange={c => onChange(c?.code ?? '', c?.name ?? '')}
        disabled={disabled}
      />
    )
  }

  if (type === 'PLAYER_SCORER') {
    return (
      <select
        value={value}
        onChange={e => {
          const opt = GOLDEN_BOOT_PLAYERS.find(p => p.value === e.target.value)
          onChange(e.target.value, opt?.label ?? e.target.value)
        }}
        disabled={disabled}
        className={base}
      >
        <option value="">— Select a player —</option>
        {GOLDEN_BOOT_PLAYERS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    )
  }

  if (type === 'PLAYER_ASSISTER') {
    return (
      <select
        value={value}
        onChange={e => {
          const opt = TOP_ASSISTER_PLAYERS.find(p => p.value === e.target.value)
          onChange(e.target.value, opt?.label ?? e.target.value)
        }}
        disabled={disabled}
        className={base}
      >
        <option value="">— Select a player —</option>
        {TOP_ASSISTER_PLAYERS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    )
  }

  if (type === 'GROUP') {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value, `Group ${e.target.value}`)}
        disabled={disabled}
        className={base}
      >
        <option value="">— Select a group —</option>
        {WC_GROUPS.map(g => (
          <option key={g} value={g}>Group {g}</option>
        ))}
      </select>
    )
  }

  return null
}
