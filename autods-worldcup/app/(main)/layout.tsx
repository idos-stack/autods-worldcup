import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import TopBar from '@/components/TopBar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
          .select('*')
    .eq('id', user.id)
    .single()

  // If profile not complete, go to onboarding
  if (!profile?.full_name || !profile?.nickname || !profile?.home_country) {
    redirect('/onboarding')
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-sm">
      <TopBar profile={profile} />
      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto pb-safe">
        {children}
      </main>
      <BottomNav isAdmin={profile?.is_admin ?? false} />
    </div>
  )
}
