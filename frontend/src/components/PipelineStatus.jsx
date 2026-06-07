const STEPS = [
  { id: 'ingestor', label: 'Ingestor', desc: 'Validating and normalizing alerts' },
  { id: 'triager', label: 'Triager', desc: 'AI triaging alert severity' },
  { id: 'enricher', label: 'Enricher', desc: 'Mapping MITRE ATT&CK techniques' },
  { id: 'analyst', label: 'Analyst', desc: 'Reconstructing attack timeline' },
  { id: 'writer', label: 'Writer', desc: 'Generating executive brief' },
]

export default function PipelineStatus({ currentAgent, isRunning }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentAgent)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isActive = step.id === currentAgent
          const isDone = currentIndex !== -1 && i < currentIndex
          const isPending = !isActive && !isDone

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                    isDone
                      ? 'bg-green-400 text-gray-950'
                      : isActive
                      ? 'bg-blue-500/20 border-2 border-blue-400 animate-pulse-slow'
                      : 'bg-gray-800 border border-gray-700 text-gray-600'
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    isDone
                      ? 'text-green-400'
                      : isActive
                      ? 'text-blue-400'
                      : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-gray-600 mt-0.5 hidden md:block text-center leading-tight max-w-[80px]">
                  {step.desc}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 self-start mt-4 ${
                    i < currentIndex ? 'bg-green-400' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
