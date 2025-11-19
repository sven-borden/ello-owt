interface WinnerSelectorProps {
  winner: 'A' | 'B' | 'DRAW' | ''
  onWinnerChange: (winner: 'A' | 'B' | 'DRAW') => void
  playerAName?: string
  playerBName?: string
  disabled?: boolean
}

export default function WinnerSelector({
  winner,
  onWinnerChange,
  playerAName,
  playerBName,
  disabled = false,
}: WinnerSelectorProps) {
  const buttonBaseClass = `
    flex-1 py-3 px-4 text-sm font-semibold transition-all duration-200
    border-2 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `

  const getButtonClass = (value: 'A' | 'B' | 'DRAW') => {
    const isSelected = winner === value
    if (isSelected) {
      return `${buttonBaseClass} bg-brand-red text-white border-brand-red shadow-md`
    }
    return `${buttonBaseClass} bg-white text-gray-custom-700 border-gray-custom-300 hover:border-brand-red hover:bg-red-50`
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-custom-600 uppercase tracking-wide">
        Match Result
      </label>
      <div className="grid grid-cols-3 gap-2">
        {/* Player A Wins */}
        <button
          type="button"
          onClick={() => onWinnerChange('A')}
          disabled={disabled}
          className={`${getButtonClass('A')} rounded-l-lg`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🏆</span>
            <span className="text-xs font-semibold">
              {playerAName || 'Player A'}
            </span>
            <span className="text-[10px] opacity-75">Wins</span>
          </div>
        </button>

        {/* Draw */}
        <button
          type="button"
          onClick={() => onWinnerChange('DRAW')}
          disabled={disabled}
          className={getButtonClass('DRAW')}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🤝</span>
            <span className="text-xs font-semibold">Draw</span>
            <span className="text-[10px] opacity-75">0.5 pts each</span>
          </div>
        </button>

        {/* Player B Wins */}
        <button
          type="button"
          onClick={() => onWinnerChange('B')}
          disabled={disabled}
          className={`${getButtonClass('B')} rounded-r-lg`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🏆</span>
            <span className="text-xs font-semibold">
              {playerBName || 'Player B'}
            </span>
            <span className="text-[10px] opacity-75">Wins</span>
          </div>
        </button>
      </div>
    </div>
  )
}
