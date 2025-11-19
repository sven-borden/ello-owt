import { Player } from '@/lib/types'
import Link from 'next/link'

interface LeaderboardCardProps {
  players: Player[]
}

const badges = {
  1: { emoji: '👑', title: 'King', color: 'text-yellow-600' },
  2: { emoji: '👸', title: 'Queen', color: 'text-gray-400' },
  3: { emoji: '🏰', title: 'Rook', color: 'text-amber-700' },
}

export default function LeaderboardCard({ players }: LeaderboardCardProps) {
  const topThree = players.slice(0, 3)
  const remaining = players.slice(3)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-custom-300">
      {/* Top 3 Players */}
      <div className="p-6 border-b border-gray-custom-300">
        <h2 className="text-xl font-bold text-almost-black mb-4">
          Leaderboard
        </h2>
        <div className="space-y-4">
          {topThree.map((player, index) => {
            const rank = index + 1
            const badge = badges[rank as keyof typeof badges]
            return (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center justify-between p-4 bg-off-white rounded-lg hover:bg-gray-custom-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center min-w-[50px]">
                    <span className={`text-2xl ${badge.color}`}>
                      {badge.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-gray-custom-600 uppercase tracking-wide">
                      {badge.title}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-almost-black">
                      {player.name}
                    </h3>
                    <p className="text-xs text-gray-custom-600">
                      {player.wins}W - {player.losses}L
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-red">
                    {player.currentElo}
                  </div>
                  <div className="text-[10px] text-gray-custom-600 uppercase tracking-wide font-semibold">Elo</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Remaining Players */}
      {remaining.length > 0 && (
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-custom-600 border-b border-gray-custom-300 uppercase tracking-wide">
                <th className="pb-3 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Player</th>
                <th className="pb-3 text-center font-semibold">Record</th>
                <th className="pb-3 text-right font-semibold">Elo</th>
              </tr>
            </thead>
            <tbody>
              {remaining.map((player, index) => (
                <tr
                  key={player.id}
                  className="border-b border-gray-custom-200 last:border-0 hover:bg-off-white transition-colors"
                >
                  <td className="py-3 text-sm text-gray-custom-600 font-medium">#{index + 4}</td>
                  <td className="py-3">
                    <Link
                      href={`/players/${player.id}`}
                      className="font-semibold text-sm text-almost-black hover:text-brand-red transition-colors"
                    >
                      {player.name}
                    </Link>
                  </td>
                  <td className="py-3 text-center text-xs text-gray-custom-600">
                    {player.wins}W - {player.losses}L
                  </td>
                  <td className="py-3 text-right font-bold text-sm text-brand-red">
                    {player.currentElo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
