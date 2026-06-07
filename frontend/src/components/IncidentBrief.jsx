const SEVERITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-500',
}

const SEVERITY_TEXT = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400',
}

export default function IncidentBrief({ brief, isRunning }) {
  if (!brief && !isRunning) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 border-2 border-gray-700 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Awaiting analysis...</p>
          <p className="text-gray-700 text-xs mt-2">Select a scenario or paste alerts above</p>
        </div>
      </div>
    )
  }

  if (!brief) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Pipeline running...</p>
          <p className="text-gray-600 text-xs mt-2">AI agents are processing the alerts</p>
        </div>
      </div>
    )
  }

  const severity = brief.severity || 'medium'
  const sevColor = SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium
  const sevText = SEVERITY_TEXT[severity] || SEVERITY_TEXT.medium

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${sevColor} text-white`}>
            {severity}
          </span>
          {brief.threat_category && (
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
              {brief.threat_category}
            </span>
          )}
        </div>
        <button
          onClick={() => window.print()}
          className="text-xs text-gray-500 hover:text-green-400 transition-colors px-3 py-1 border border-gray-700 rounded"
        >
          Export PDF
        </button>
      </div>

      <div className="divide-y divide-gray-800">
        {brief.executive_summary && (
          <Section title="Executive Summary" borderColor="border-l-green-400">
            <p className="text-sm text-gray-300 leading-relaxed">{brief.executive_summary}</p>
          </Section>
        )}

        {brief.what_happened && (
          <Section title="What Happened" borderColor="border-l-blue-400">
            <p className="text-sm text-gray-300 leading-relaxed">{brief.what_happened}</p>
          </Section>
        )}

        {brief.affected_systems && brief.affected_systems.length > 0 && (
          <Section title="Affected Systems" borderColor="border-l-orange-400">
            <div className="flex flex-wrap gap-2">
              {brief.affected_systems.map((sys, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 font-mono">
                  {sys}
                </span>
              ))}
            </div>
          </Section>
        )}

        {brief.recommended_actions && brief.recommended_actions.length > 0 && (
          <Section title="Recommended Actions" borderColor="border-l-red-400">
            <div className="space-y-2">
              {brief.recommended_actions.map((action, i) => (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-green-400
                               focus:ring-green-400/30 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                    {action}
                  </span>
                </label>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, borderColor, children }) {
  return (
    <div className={`px-5 py-4 border-l-2 ${borderColor}`}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}
