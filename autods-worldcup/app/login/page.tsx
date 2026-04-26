'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'autods.com' }, // restrict to AutoDS domain
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-navy to-[#0d1a33] flex flex-col items-center justify-center px-4">
      {/* Logo / title */}
      <div className="text-center mb-10">
        <p className="text-brand-orange text-4xl font-extrabold tracking-tight">AutoDS</p>
        <p className="text-white text-5xl font-black tracking-tighter leading-none">WorldCup</p>
        <p className="text-brand-orange text-5xl font-black tracking-tighter">2026</p>
        <p className="text-gray-400 mt-3 text-sm">Prediction Platform</p>
      </div>

      {/* Trophy emoji decoration */}
      <div className="text-7xl mb-8 select-none">🏆</div>

      {/* Sign-in card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-sm text-center">
        <h2 className="text-white font-bold text-xl mb-2">Sign in to compete</h2>
        <p className="text-gray-400 text-sm mb-6">Use your AutoDS Google account</p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold
                     py-3 px-6 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-150 shadow-lg"
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-gray-500 text-xs mt-4">@autods.com accounts only</p>
      </div>

      {/* Flags decoration */}
      <div className="mt-10 text-2xl select-none opacity-40">
        🇺🇸 🇧🇷 🇫🇷 🇩🇪 🇪🇸 🇦🇷 🏴󠁧󠁢󠁥󠁮󠁧󠁿 🇵🇹
      </div>
    </div>
  )
}
