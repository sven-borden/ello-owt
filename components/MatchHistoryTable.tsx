import { Match } from '@/lib/types'
import { format } from 'date-fns'
import Link from 'next/link'

interface MatchHistoryTableProps {
  matches: Match[]
}

export default function MatchHistoryTable({ matches }: MatchHistoryTableProps) {
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-12 text-center">
        <p className="text-gray-custom-600 text-lg">No matches recorded yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-off-white border-b border-gray-custom-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-custom-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-custom-700">
                Player A
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-custom-700">
                vs
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-custom-700">
                Player B
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-custom-700">
                Winner
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-custom-700">
                Elo Changes
              </th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const playerAWon = match.winner === 'A'
              const playerBWon = match.winner === 'B'
              const playerAChange = match.playerAEloAfter - match.playerAEloBefore
              const playerBChange = match.playerBEloAfter - match.playerBEloBefore

              return (
                <tr
                  key={match.id}
                  className="border-b border-gray-custom-200 last:border-0 hover:bg-off-white transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-custom-600 whitespace-nowrap">
                    {format(match.timestamp, 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/players/${match.playerAId}`}
                        className={`font-semibold hover:text-brand-red transition-colors ${
                          playerAWon ? 'text-brand-red' : 'text-gray-custom-700'
                        }`}
                      >
                        {match.playerAName}
                      </Link>
                      {playerAWon && <span className="text-brand-red">🏆</span>}
                    </div>
                    <div className="text-xs text-gray-custom-500">
                      {match.playerAEloBefore} → {match.playerAEloAfter}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-custom-400 font-semibold">
                    VS
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/players/${match.playerBId}`}
                        className={`font-semibold hover:text-brand-red transition-colors ${
                          playerBWon ? 'text-brand-red' : 'text-gray-custom-700'
                        }`}
                      >
                        {match.playerBName}
                      </Link>
                      {playerBWon && <span className="text-brand-red">🏆</span>}
                    </div>
                    <div className="text-xs text-gray-custom-500">
                      {match.playerBEloBefore} → {match.playerBEloAfter}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-semibold text-brand-red">
                      {playerAWon ? match.playerAName : match.playerBName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-sm font-semibold ${
                          playerAChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {playerAChange > 0 ? '+' : ''}
                        {playerAChange}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          playerBChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {playerBChange > 0 ? '+' : ''}
                        {playerBChange}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
