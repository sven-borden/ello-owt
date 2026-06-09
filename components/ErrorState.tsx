interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[400px] text-center px-4"
    >
      <div className="text-4xl mb-4" aria-hidden="true">
        ⚠️
      </div>
      <p className="text-gray-custom-700 text-lg font-semibold mb-2 max-w-md">
        Something went wrong
      </p>
      <p className="text-sm text-gray-custom-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-brand-red text-white font-semibold py-2.5 px-6 rounded-lg hover:shadow-lg transition-all text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  )
}
