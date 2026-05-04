——import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/predictions'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Enforce AutoDS domain
      const email = data.user.email ?? ''
      if (!email.endsWith('@autods.com')) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=domain`)
      }

      // Check if profile is complete; if not, redirect to onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, nickname, home_country')
        .eq('id', data.user.id)
        .single()

      if (!profile?.full_name || !profile?.nickname || !profile?.home_country) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
