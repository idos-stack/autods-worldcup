import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-side admin check
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/predictions')

  // Fetch all contestants
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  // Fetch all predictions with match info
  const { data: predictions } = await supabase
    .from('predictions')
    .select(`
      *,
      matches (home_team_name, away_team_name, kickoff_time, stage, home_score, away_score)
    `)
    .order('updated_at', { ascending: false })

  // Fetch wildcard answers
  const { data: wildcardAnswers } = await supabase
    .from('wildcard_answers')
    .select(`*, wildcard_questions (question)`)

  return (
    <AdminClient
      profiles={profiles ?? []}
      predictions={predictions ?? []}
      wildcardAnswers={wildcardAnswers ?? []}
    />
  )
}
