'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { EloHistory } from '@/lib/types'

interface EloChartProps {
  history: EloHistory[]
}

type ViewMode = 'matches' | 'time'

export default function EloChart({ history }: EloChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('matches')

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-12 text-center">
        <p className="text-gray-custom-600">No Elo history available yet</p>
      </div>
    )
  }

  // Sort history by timestamp
  const sortedHistory = [...history].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Format data for Recharts based on view mode
  const chartData = sortedHistory.map((entry, index) => ({
    timestamp: entry.timestamp.getTime(),
    matchIndex: index,
    date: format(entry.timestamp, 'MMM dd'),
    fullDate: format(entry.timestamp, 'MMM dd, yyyy HH:mm'),
    elo: entry.elo,
  }))

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-custom-300 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-almost-black">Elo Rating Over Time</h2>
        <div className="flex gap-2 bg-gray-custom-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('matches')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'matches'
                ? 'bg-white text-almost-black shadow-sm'
                : 'text-gray-custom-600 hover:text-almost-black'
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => setViewMode('time')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'time'
                ? 'bg-white text-almost-black shadow-sm'
                : 'text-gray-custom-600 hover:text-almost-black'
            }`}
          >
            Time
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
          <XAxis
            dataKey={viewMode === 'time' ? 'timestamp' : 'matchIndex'}
            stroke="#696969"
            style={{ fontSize: '12px' }}
            tickFormatter={(value, index) => {
              if (viewMode === 'time') {
                return format(new Date(value), 'MMM dd')
              }
              // In matches mode, show the date for this match index
              if (chartData[value]) {
                return chartData[value].date
              }
              return value
            }}
            type={viewMode === 'time' ? 'number' : 'category'}
            domain={viewMode === 'time' ? ['dataMin', 'dataMax'] : undefined}
            scale={viewMode === 'time' ? 'time' : undefined}
          />
          <YAxis
            stroke="#696969"
            style={{ fontSize: '12px' }}
            domain={['dataMin - 10', 'dataMax + 10']}
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
