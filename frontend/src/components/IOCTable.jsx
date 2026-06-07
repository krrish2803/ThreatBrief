import { useState } from 'react'

const TYPE_BADGES = {
  IP: 'bg-blue-900/40 text-blue-400 border-blue-800',
  Domain: 'bg-purple-900/40 text-purple-400 border-purple-800',
  Hash: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  Username: 'bg-green-900/40 text-green-400 border-green-800',
  FilePath: 'bg-gray-800 text-gray-400 border-gray-700',
}

export default function IOCTable({ iocs }) {
  const [copiedIndex, setCopiedIndex] = useState(null)

  if (!iocs || iocs.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Indicators of Compromise</h3>
        <p className="text-gray-600 text-xs">No IOCs extracted</p>
      </div>
    )
  }

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (e) {
      // fallback
    }
  }

  const copyAll = () => {
    const all = iocs.map((ioc) => ioc.value).join('\n')
    copyToClipboard(all, 'all')
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Indicators of Compromise</h3>
        <button
          onClick={copyAll}
          className="text-[10px] text-gray-500 hover:text-green-400 transition-colors px-2 py-1 border border-gray-700 rounded"
        >
          {copiedIndex === 'all' ? 'Copied!' : 'Copy All'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex text-[10px] text-gray-600 font-semibold uppercase tracking-wider px-2 py-1">
          <div className="w-20 flex-shrink-0">Type</div>
          <div className="flex-1">Value</div>
          <div className="w-14 text-right">Action</div>
        </div>
        {iocs.map((ioc, i) => {
          const badgeStyle = TYPE_BADGES[ioc.type] || TYPE_BADGES.FilePath
          return (
            <div
              key={i}
              className={`flex items-center px-2 py-2 rounded text-xs ${i % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-900/50'}`}
            >
              <div className="w-20 flex-shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${badgeStyle}`}>
                  {ioc.type}
                </span>
              </div>
              <div className="flex-1 font-mono text-gray-300 truncate text-[11px]">{ioc.value}</div>
              <div className="w-14 flex-shrink-0 text-right">
                <button
                  onClick={() => copyToClipboard(ioc.value, i)}
                  className="text-gray-600 hover:text-green-400 transition-colors text-[10px]"
                >
                  {copiedIndex === i ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
