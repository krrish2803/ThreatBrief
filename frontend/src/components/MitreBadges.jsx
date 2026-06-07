const TACTIC_COLORS = {
  'Impact': { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-800' },
  'Exfiltration': { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-800' },
  'Lateral Movement': { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-800' },
  'Credential Access': { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-800' },
  'Defense Evasion': { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' },
  'Discovery': { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-800' },
  'Execution': { bg: 'bg-cyan-900/30', text: 'text-cyan-400', border: 'border-cyan-800' },
  'Privilege Escalation': { bg: 'bg-pink-900/30', text: 'text-pink-400', border: 'border-pink-800' },
}

export default function MitreBadges({ techniques }) {
  if (!techniques || techniques.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MITRE ATT&CK</h3>
        <p className="text-gray-600 text-xs">No techniques identified</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MITRE ATT&CK</h3>
      <div className="grid grid-cols-2 gap-2">
        {techniques.map((t, i) => {
          const colors = TACTIC_COLORS[t.tactic] || { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' }
          return (
            <a
              key={i}
              href={`https://attack.mitre.org/techniques/${t.id.replace('.', '/')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${colors.bg} ${colors.border} border rounded-lg p-2.5 hover:opacity-80 transition-opacity`}
            >
              <div className="text-xs font-bold text-white">{t.id}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.name}</div>
              <div className={`text-[9px] ${colors.text} mt-1 uppercase font-medium`}>{t.tactic}</div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
