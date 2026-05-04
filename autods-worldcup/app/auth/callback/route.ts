import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get('code')
  const next  = searchParams.get('next') ?? '/predictions'

  if (code) {
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []
        const cookieStore = cookies()
        const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { cookies: { getAll() { return cookieStore.getAll() }, setAll(items) { items.forEach(i => { try { cookieStore.set(i.name, i.value, i.options as any) } catch {} }) } } }
              )
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
