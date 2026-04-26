'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import Image from 'next/image'
import { flagUrl, formatMatchDate } from '@/lib/utils'
import clsx from 'clsx'

type Props = {
  profiles: Profile[]
  predictions: any[]
  wildcardAnswers: any[]
}

type AdminTab = 'contestants' | 'predictions' | 'wildcards'

export default function AdminClient({ profiles: initialProfiles, predictions, wildcardAnswers }: Props) {
  const supabase = createClient()
  const [profiles,     setProfiles]    = useState(initialProfiles)
  const [tab,          setTab]         = useState<AdminTab>('contestants')
  const [editingId,    setEditingId]   = useState<string | null>(null)
  const [editForm,     setEditForm]    = useState<Partial<Profile>>({})
  const [filterUser,   setFilterUser]  = useState('')
  const [toast,        setToast]       = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ ...editForm, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { showToast('❌ Save failed'); return }
    setProfiles(ps => ps.map(p => p.id === id ? { ...p, ...editForm } : p))
    setEditingId(null)
    showToast('✅ Saved')
  }

  async function removeContestant(id: string, name: string) {
    if (!confirm(`Remove ${name} from the competition? This cannot be undone.`)) return
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)
    if (error) { showToast('❌ Failed'); return }
    setProfiles(ps => ps.map(p => p.id === id ? { ...p, is_active: false } : p))
    showToast(`🗑 ${name} removed`)
  }

  async function adjustScore(id: string, name: string) {
    const current = profiles.find(p => p.id === id)?.score_override ?? ''
    const val = prompt(`Enter score override for ${name} (leave blank to use calculated score):`, String(current))
    if (val === null) return
    const override = val.trim() === '' ? null : parseInt(val)
    if (val.trim() !== '' && isNaN(override as number)) { showToast('❌ Invalid number'); return }
    const { error } = await supabase.from('profiles').update({ score_override: override }).eq('id', id)
    if (error) { showToast('❌ Failed'); return }
    setProfiles(ps => ps.map(p => p.id === id ? { ...p, score_override: override } : p))
    showToast(`✅ Score override set for ${name}`)
  }

  const filteredPredictions = filterUser
    ? predictions.filter(p => p.user_id === filterUser)
    : predictions

  const filteredWildcards = filterUser
    ? wildcardAnswers.filter(a => a.user_id === filterUser)
    : wildcardAnswers

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="bg-brand-navy text-white px-4 py-3 shrink-0">
        <h2 className="font-bold text-base">🔧 Manager Dashboard</h2>
        <p className="text-xs text-gray-400">Visible to admins only</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 border-b border-gray-200 shrink-0">
        {([
          { key: 'contestants', label: '👥 Contestants' },
          { key: 'predictions', label: '⚽ Predictions' },
          { key: 'wildcards',   label: '🎯 Wild Cards' },
        ] as { key: AdminTab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              tab === t.key ? 'text-brand-orange border-b-2 border-brand-orange bg-white' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* ── CONTESTANTS ──────────────────────────────── */}
        {tab === 'contestants' && (
          <>
            <p className="text-xs text-gray-400">{profiles.filter(p => p.is_active).length} active contestants</p>
            {profiles.map(p => (
              <div key={p.id} className={clsx(
                'bg-white border rounded-xl p-4',
                !p.is_active && 'opacity-50 border-dashed'
              )}>
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <input
                      value={editForm.full_name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Full name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <input
                      value={editForm.nickname ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                      placeholder="Nickname"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <input
                      value={editForm.home_country_name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, home_country_name: e.target.value }))}
                      placeholder="Country name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-orange"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => saveEdit(p.id)} className="flex-1 bg-brand-orange text-white text-sm font-semibold py-2 rounded-lg">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2 rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {p.home_country && (
                        <Image src={flagUrl(p.home_country, 'w20')} alt="" width={20} height={14} className="rounded-sm" unoptimized />
                      )}
                      <div>
                        <p className="font-semibold text-sm">{p.full_name ?? '—'} <span className="text-gray-400 font-normal">({p.nickname ?? '—'})</span></p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                      {!p.is_active && <span className="ml-auto text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded">Removed</span>}
                      {p.score_override !== null && (
                        <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Override: {p.score_override}</span>
                      )}
                    </div>
                    {p.is_active && (
                      <div className="flex gap-2 pt-1 border-t border-gray-100">
                        <button
                          onClick={() => { setEditingId(p.id); setEditForm({ full_name: p.full_name, nickname: p.nickname, home_country_name: p.home_country_name }) }}
                          className="flex-1 text-xs text-gray-600 font-medium py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >✏️ Edit</button>
                        <button
                          onClick={() => adjustScore(p.id, p.full_name ?? p.email)}
                          className="flex-1 text-xs text-brand-navy font-medium py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >🔢 Score</button>
                        <button
                          onClick={() => removeContestant(p.id, p.full_name ?? p.email)}
                          className="flex-1 text-xs text-red-500 font-medium py-1.5 border border-red-200 rounded-lg hover:bg-red-50"
                        >🗑 Remove</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── PREDICTIONS ──────────────────────────────── */}
        {tab === 'predictions' && (
          <>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-orange"
            >
              <option value="">— All contestants —</option>
              {profiles.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email} ({p.nickname})</option>
              ))}
            </select>

            <div className="space-y-2">
              {filteredPredictions.slice(0, 100).map((pred: any) => {
                const profile = profiles.find(p => p.id === pred.user_id)
                const match   = pred.matches
                return (
                  <div key={pred.id} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-brand-navy">{profile?.nickname ?? profile?.full_name ?? '?'}</span>
                      {pred.scored && (
                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
                          pred.points_total > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                        )}>
                          {pred.points_total > 0 ? `+${pred.points_total} pts` : '0 pts'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">
                      {match?.home_team_name ?? '?'} {pred.predicted_home} – {pred.predicted_away} {match?.away_team_name ?? '?'}
                    </p>
                    {pred.predicted_winner && (
                      <p className="text-xs text-gray-400 mt-0.5">Advances: {pred.predicted_winner}</p>
                    )}
                    {match && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatMatchDate(match.kickoff_time)} · {match.stage}
                        {match.home_score !== null && ` · Result: ${match.home_score}–${match.away_score}`}
                      </p>
                    )}
                  </div>
                )
              })}
              {filteredPredictions.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No predictions yet.</p>
              )}
            </div>
          </>
        )}

        {/* ── WILD CARDS ───────────────────────────────── */}
        {tab === 'wildcards' && (
          <>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-orange"
            >
              <option value="">— All contestants —</option>
              {profiles.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>{p.full_name ?? p.email} ({p.nickname})</option>
              ))}
            </select>

            <div className="space-y-2">
              {filteredWildcards.map((a: any) => {
                const profile = profiles.find(p => p.id === a.user_id)
                return (
                  <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-brand-navy">{profile?.nickname ?? profile?.full_name ?? '?'}</span>
                      {a.scored && (
                        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full',
                          a.points > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                        )}>
                          {a.points > 0 ? `+${a.points} pts` : '0 pts'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{a.wildcard_questions?.question}</p>
                    <p className="text-sm font-medium mt-0.5">{a.answer_label ?? a.answer ?? '—'}</p>
                  </div>
                )
              })}
              {filteredWildcards.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">No wild card answers yet.</p>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
