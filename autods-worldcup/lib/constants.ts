// ─── Scoring ──────────────────────────────────────────────────────────────────
export const POINTS = {
  GROUP_OUTCOME:      5,
  GROUP_EXACT:        5,   // extra on top of outcome
  KNOCKOUT_OUTCOME:  10,
  KNOCKOUT_EXACT:     5,   // extra on top of outcome
  KNOCKOUT_PROGRESS: 10,
  WILDCARD:          30,
} as const

// ─── WC 2026 Groups (12 groups A-L, 48 teams) ────────────────────────────────
export const WC_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

// ─── Golden Boot nominees ─────────────────────────────────────────────────────
export const GOLDEN_BOOT_PLAYERS = [
  { value: 'mbappe',    label: 'Kylian Mbappé (France)' },
  { value: 'olise',     label: 'Michael Olise (France)' },
  { value: 'vinicius',  label: 'Vinícius Júnior (Brazil)' },
  { value: 'yamal',     label: 'Lamine Yamal (Spain)' },
  { value: 'haaland',   label: 'Erling Haaland (Norway)' },
  { value: 'dembele',   label: 'Ousmane Dembélé (France)' },
  { value: 'kane',      label: 'Harry Kane (England)' },
  { value: 'gyokeres',  label: 'Viktor Gyökeres (Sweden)' },
  { value: 'lautaro',   label: 'Lautaro Martínez (Argentina)' },
  { value: 'igor',      label: 'Igor Thiago (Brazil)' },
  { value: 'undav',     label: 'Deniz Undav (Germany)' },
  { value: 'ronaldo',   label: 'Cristiano Ronaldo (Portugal)' },
  { value: 'wirtz',     label: 'Florian Wirtz (Germany)' },
  { value: 'messi',     label: 'Lionel Messi (Argentina)' },
  { value: 'diaz',      label: 'Luis Díaz (Colombia)' },
  { value: 'cherki',    label: 'Rayan Cherki (France)' },
  { value: 'OTHER',     label: 'Other (player not listed above)' },
] as const

// ─── Top Assister nominees ────────────────────────────────────────────────────
export const TOP_ASSISTER_PLAYERS = [
  { value: 'olise',     label: 'Michael Olise (France)' },
  { value: 'vinicius',  label: 'Vinícius Júnior (Brazil)' },
  { value: 'yamal',     label: 'Lamine Yamal (Spain)' },
  { value: 'dembele',   label: 'Ousmane Dembélé (France)' },
  { value: 'kane',      label: 'Harry Kane (England)' },
  { value: 'bruno',     label: 'Bruno Fernandes (Portugal)' },
  { value: 'debruyne',  label: 'Kevin De Bruyne (Belgium)' },
  { value: 'messi',     label: 'Lionel Messi (Argentina)' },
  { value: 'bellingham',label: 'Jude Bellingham (England)' },
  { value: 'wirtz',     label: 'Florian Wirtz (Germany)' },
  { value: 'guler',     label: 'Arda Güler (Turkey)' },
  { value: 'cherki',    label: 'Rayan Cherki (France)' },
  { value: 'foden',     label: 'Phil Foden (England)' },
  { value: 'bernardo',  label: 'Bernardo Silva (Portugal)' },
  { value: 'simons',    label: 'Xavi Simons (Netherlands)' },
  { value: 'OTHER',     label: 'Other (player not listed above)' },
] as const

// ─── Stage display names ──────────────────────────────────────────────────────
export const STAGE_LABELS: Record<string, string> = {
  GROUP:         'Group Stage',
  ROUND_OF_32:   'Round of 32',
  ROUND_OF_16:   'Round of 16',
  QUARTER_FINAL: 'Quarter-final',
  SEMI_FINAL:    'Semi-final',
  THIRD_PLACE:   'Third-place Play-off',
  FINAL:         'Final',
}

// ─── Kick-off deadline (minutes before match) ─────────────────────────────────
export const DEADLINE_MINUTES = 5

// ─── Colours ─────────────────────────────────────────────────────────────────
export const BRAND = {
  orange: '#FF6B35',
  navy:   '#1A2F5A',
} as const
