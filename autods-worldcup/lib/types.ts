// ─── Database types ───────────────────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      matches: { Row: Match; Insert: Partial<Match>; Update: Partial<Match> }
      predictions: { Row: Prediction; Insert: Partial<Prediction>; Update: Partial<Prediction> }
      wildcard_questions: { Row: WildcardQuestion; Insert: Partial<WildcardQuestion>; Update: Partial<WildcardQuestion> }
      wildcard_answers: { Row: WildcardAnswer; Insert: Partial<WildcardAnswer>; Update: Partial<WildcardAnswer> }
      wildcard_results: { Row: WildcardResult; Insert: Partial<WildcardResult>; Update: Partial<WildcardResult> }
      leaderboard_snapshots: { Row: LeaderboardSnapshot; Insert: Partial<LeaderboardSnapshot>; Update: Partial<LeaderboardSnapshot> }
    }
  }
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  nickname: string | null
  home_country: string | null
  home_country_name: string | null
  is_admin: boolean
  is_active: boolean
  score_override: number | null
  created_at: string
  updated_at: string
}

export type Match = {
  id: string
  external_id: number | null
  stage: MatchStage
  group_name: string | null
  home_team_code: string | null
  home_team_name: string | null
  away_team_code: string | null
  away_team_name: string | null
  kickoff_time: string
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  home_score_et: number | null
  away_score_et: number | null
  winner_code: string | null
  matchday: number | null
  created_at: string
  updated_at: string
}

export type MatchStage = 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'THIRD_PLACE' | 'FINAL'
export type MatchStatus = 'SCHEDULED' | 'TIMED' | 'LIVE' | 'FINISHED' | 'POSTPONED'

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  predicted_home: number | null
  predicted_away: number | null
  predicted_winner: string | null
  points_outcome: number
  points_exact: number
  points_progression: number
  points_total: number
  scored: boolean
  created_at: string
  updated_at: string
}

export type WildcardQuestion = {
  id: number
  question: string
  answer_type: 'COUNTRY' | 'PLAYER_SCORER' | 'PLAYER_ASSISTER' | 'GROUP'
  sort_order: number
}

export type WildcardAnswer = {
  id: string
  user_id: string
  question_id: number
  answer: string | null
  answer_label: string | null
  points: number
  scored: boolean
  created_at: string
  updated_at: string
}

export type WildcardResult = {
  question_id: number
  correct_value: string | null
  correct_label: string | null
  confirmed: boolean
  confirmed_at: string | null
}

export type LeaderboardSnapshot = {
  id: string
  user_id: string
  rank: number
  prev_rank: number | null
  total_score: number
  score_24h: number
  snapshot_at: string
}

// ─── UI types ─────────────────────────────────────────────────────────────────
export type LeaderboardEntry = {
  user_id: string
  full_name: string | null
  nickname: string | null
  home_country: string | null
  home_country_name: string | null
  rank: number
  prev_rank: number | null
  total_score: number
  score_24h: number
}

export type MatchWithPrediction = Match & {
  prediction?: Prediction | null
}

export type WildcardQuestionWithAnswer = WildcardQuestion & {
  answer?: WildcardAnswer | null
  result?: WildcardResult | null
}
