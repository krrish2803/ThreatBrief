const DOT_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-gray-500',
}

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h3>
        <p className="text-gray-600 text-xs">No timeline events</p>
      </div>
    )
  }

  const sorted = [...events].sort((a, b) => {
    if (a.timestamp < b.timestamp) return 1
    if (a.timestamp > b.timestamp) return -1
    return 0
  })

  const displayed = sorted.slice(0, 8)
  const remaining = sorted.length - 8

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h3>
      <div className={`space-y-0 ${sorted.length > 8 ? 'max-h-80 overflow-y-auto' : ''}`}>
        {displayed.map((e, i) => {
          const dotColor = DOT_COLORS[e.significance] || DOT_COLORS.medium
          return (
            <div key={i} className="flex gap-3 pb-3 relative">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} mt-1.5 flex-shrink-0`} />
                {i < displayed.length - 1 && (
                  <div className="w-px flex-1 bg-gray-800 mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-gray-500">{e.timestamp}</div>
                <div className="text-sm text-gray-300 mt-0.5">{e.event}</div>
              </div>
            </div>
          )
        })}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-gray-600 text-center mt-2">+{remaining} more events</p>
      )}
    </div>
  )
}
