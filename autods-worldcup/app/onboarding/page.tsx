'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CountrySelect from '@/components/CountrySelect'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName,  setFullName]  = useState('')
  const [nickname,  setNickname]  = useState('')
  const [country,   setCountry]   = useState<{ code: string; name: string } | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !nickname.trim() || !country) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      nickname:  nickname.trim(),
      home_country: country.code,
      home_country_name: country.name,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    if (err) { setError('Something went wrong. Please try again.'); setLoading(false); return }
    router.push('/predictions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-navy to-[#0d1a33] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-brand-orange font-extrabold text-2xl">AutoDS WorldCup 2026</p>
          <p className="text-white text-xl font-bold mt-1">Set up your profile</p>
          <p className="text-gray-400 text-sm mt-1">One-time setup before you start predicting</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-4 shadow-2xl">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Ido Samara"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nickname</label>
            <input
              type="text" value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="e.g. GoalMachine"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Home Country</label>
            <CountrySelect value={country} onChange={setCountry} />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-orange text-white font-bold py-3 rounded-xl
                       hover:bg-brand-orange/90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Saving...' : "Let's go! ⚽"}
          </button>
        </form>
      </div>
    </div>
  )
}
