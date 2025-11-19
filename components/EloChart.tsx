'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { EloHistory } from '@/lib/types'

interface EloChartProps {
  history: EloHistory[]
}

export default function EloChart({ history }: EloChartProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-12 text-center">
        <p className="text-gray-custom-600">No Elo history available yet</p>
      </div>
    )
  }

  // Sort history by timestamp
  const sortedHistory = [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Format data for Recharts
  const chartData = sortedHistory.map((entry) => ({
    date: format(entry.timestamp, 'MMM dd'),
    fullDate: format(entry.timestamp, 'MMM dd, yyyy HH:mm'),
    elo: entry.elo,
  }))

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
      <h2 className="text-xl font-bold text-almost-black mb-6">Elo Rating Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis
            dataKey="date"
            stroke="#696969"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#696969"
            style={{ fontSize: '12px' }}
            domain={['dataMin - 50', 'dataMax + 50']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #CCCCCC',
              borderRadius: '8px',
              padding: '8px',
            }}
            labelStyle={{ color: '#140406', fontWeight: 'bold' }}
            formatter={(value: number) => [value, 'Elo']}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.fullDate
              }
              return label
            }}
          />
          <Line
            type="monotone"
            dataKey="elo"
            stroke="#99211C"
            strokeWidth={2}
            dot={{ fill: '#99211C', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
