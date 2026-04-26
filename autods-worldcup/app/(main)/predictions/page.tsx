import { createClient } from '@/lib/supabase/server'
import PredictionsClient from '@/components/PredictionsClient'

export const revalidate = 60  // revalidate every 60s server-side

export default async function PredictionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_time', { ascending: true })

  // Fetch user's predictions
  const { data: predictions } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user!.id)

  // Fetch wildcard questions
  const { data: wildcardQuestions } = await supabase
    .from('wildcard_questions')
    .select('*')
    .order('sort_order')

  // Fetch user's wildcard answers
  const { data: wildcardAnswers } = await supabase
    .from('wildcard_answers')
    .select('*')
    .eq('user_id', user!.id)

  // Fetch wildcard results (revealed after Final)
  const { data: wildcardResults } = await supabase
    .from('wildcard_results')
    .select('*')
    .eq('confirmed', true)

  // Build prediction map
  const predMap = Object.fromEntries((predictions ?? []).map(p => [p.match_id, p]))
  const wcAnswerMap = Object.fromEntries((wildcardAnswers ?? []).map(a => [a.question_id, a]))
  const wcResultMap = Object.fromEntries((wildcardResults ?? []).map(r => [r.question_id, r]))

  return (
    <PredictionsClient
      userId={user!.id}
      matches={matches ?? []}
      predMap={predMap}
      wildcardQuestions={wildcardQuestions ?? []}
      wcAnswerMap={wcAnswerMap}
      wcResultMap={wcResultMap}
    />
  )
}
