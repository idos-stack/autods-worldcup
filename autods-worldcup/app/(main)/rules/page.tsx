export default function RulesPage() {
  return (
    <div className="overflow-y-auto h-full">
      <div className="p-4 space-y-5 pb-8">

        {/* Header */}
        <div className="bg-brand-navy rounded-2xl p-4 text-white text-center">
          <p className="text-2xl mb-1">📋</p>
          <h2 className="font-black text-xl">Competition Rules</h2>
          <p className="text-gray-300 text-xs mt-1">AutoDS WorldCup 2026</p>
        </div>

        <Section title="⚽ How It Works">
          <p>Predict the score of every World Cup 2026 fixture and answer 9 wildcard questions to earn points. The contestant with the most points at the end of the tournament wins.</p>
        </Section>

        <Section title="🎯 Wild Card Predictions">
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li>• Answer all 9 tournament-wide questions <strong>before the opening kick-off</strong> (deadline: 5 minutes before the first match).</li>
            <li>• Wild card points are awarded <strong>only after the Final</strong> — results are pulled automatically from the official FIFA website.</li>
            <li>• Each correct answer earns <strong className="text-brand-orange">30 points</strong>.</li>
            <li>• For "most/least" questions: if multiple teams or players share the top record, <strong>any of the joint leaders counts as correct</strong>.</li>
            <li>• For Best Scorer &amp; Top Assister: the list shows suggested players. <strong>"Other"</strong> means you believe the winner is a player <em>not</em> on the list — if the actual winner is unlisted, everyone who chose "Other" earns 30 pts.</li>
          </ul>
        </Section>

        <Section title="🏟️ Group Stage Scoring">
          <ScoreTable rows={[
            ['Correct result (Win / Draw / Loss)',  '5 pts',  'Right outcome at full time'],
            ['Exact scoreline',                      '+5 pts', 'Stacks with result — max 10 pts per match'],
          ]} />
          <p className="text-xs text-gray-500 mt-2">Example: Score is 2–1. Guessing 2–1 = 10 pts · Guessing 1–0 (correct winner) = 5 pts · Guessing 0–1 (wrong) = 0 pts.</p>
        </Section>

        <Section title="🥊 Knockout Stage Scoring">
          <p className="text-sm text-gray-600 mb-2">Each criterion is scored <strong>independently</strong> — partial points are always awarded.</p>
          <ScoreTable rows={[
            ['Correct 90-min result',     '10 pts',  'Win / Draw / Loss at full time'],
            ['Exact 90-min scoreline',    '+5 pts',  'Stacks with result — max 15 pts combined'],
            ['Correct team to advance',   '+10 pts', 'Who progresses, regardless of ET/penalties'],
          ]} />
          <p className="text-xs text-gray-500 mt-2">Maximum per knockout match: <strong>25 pts</strong> (10 + 5 + 10).</p>
          <p className="text-xs text-gray-500 mt-1">Example: Game ends 1–1, Team A wins on penalties. You guessed 1–1 and Team A to advance = 25 pts. You guessed 2–0 but Team A to advance = 10 pts.</p>
        </Section>

        <Section title="⏱️ Deadlines">
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li>• <strong>Wild cards:</strong> 5 minutes before the opening match of the tournament.</li>
            <li>• <strong>Group &amp; knockout matches:</strong> 5 minutes before each individual kick-off.</li>
            <li>• Predictions can be changed as many times as you like before the deadline — only your last saved prediction counts.</li>
            <li>• Predictions are saved automatically — no submit button needed.</li>
            <li>• Once the deadline passes, the prediction field is locked. Missing a deadline = 0 pts for that match.</li>
          </ul>
        </Section>

        <Section title="🔒 Knockout Fixtures">
          <p className="text-sm text-gray-700">Knockout matches only open for predictions once <strong>both competing sides are confirmed</strong>. Until then, a placeholder message is shown. As soon as both teams are known, the fixture unlocks immediately.</p>
        </Section>

        <Section title="🏆 Standings">
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li>• The leaderboard and all match results refresh automatically every <strong>15 minutes</strong>.</li>
            <li>• All columns (rank, score, +24h points, previous rank) update automatically based on your results — no manual action required.</li>
            <li>• The <strong>+24h</strong> column shows points earned in the last 24 hours.</li>
            <li>• The ▲ / ▼ indicator shows your rank movement since the last refresh.</li>
          </ul>
        </Section>

        <Section title="📱 How to Use the App">
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li>• Use the three tabs at the bottom to navigate: <strong>My Guesses</strong>, <strong>Standings</strong>, and <strong>Rules</strong>.</li>
            <li>• In My Guesses, use the sub-tabs to switch between Wild Cards, Group Stage, and Knockout matches.</li>
            <li>• Scroll down within any tab to see all content.</li>
            <li>• On the Standings tab, the column header row stays fixed at the top as you scroll.</li>
          </ul>
        </Section>

        <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-xl p-4 text-center">
          <p className="text-brand-orange font-bold text-sm">Good luck to everyone! 🏆⚽</p>
          <p className="text-gray-500 text-xs mt-1">May the best predictor win.</p>
        </div>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="font-bold text-brand-navy text-sm mb-3">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

function ScoreTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th className="text-left px-3 py-2 font-semibold">Prediction</th>
            <th className="text-center px-3 py-2 font-semibold w-16">Pts</th>
            <th className="text-left px-3 py-2 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([pred, pts, notes], i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-3 py-2 font-medium">{pred}</td>
              <td className="px-3 py-2 text-center font-bold text-brand-orange">{pts}</td>
              <td className="px-3 py-2 text-gray-500">{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
