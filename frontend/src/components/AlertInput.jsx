import { useState, useEffect } from 'react'
import { API_URL } from '../config'

const SCENARIOS = [
  { id: 'brute-force', label: 'Brute Force', icon: '🔑' },
  { id: 'lateral-movement', label: 'Lateral Movement', icon: '🔄' },
  { id: 'ransomware', label: 'Ransomware', icon: '💀' },
]

export default function AlertInput({ onRunScenario, onAnalyzeAlerts, isRunning }) {
  const [customAlerts, setCustomAlerts] = useState('')
  const [splunkMode, setSplunkMode] = useState(false)
  const [error, setError] = useState(null)

  const handleScenarioClick = async (id, label) => {
    setError(null)
    await onRunScenario(id, label)
  }

  const handleAnalyze = async () => {
    setError(null)
    if (splunkMode) {
      try {
        setError('Connecting to Splunk...')
        const res = await fetch(`${API_URL}/api/splunk/alerts`)
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.detail || `Splunk returned ${res.status}`)
        }
        const data = await res.json()
        if (!Array.isArray(data.alerts)) {
          throw new Error('Invalid response from Splunk endpoint')
        }
        if (data.alerts.length === 0) {
          setError('No critical/high alerts found in the last hour')
          return
        }
        setError(null)
        onAnalyzeAlerts(data.alerts, true)
      } catch (e) {
        setError(e.message || 'Failed to fetch Splunk alerts. Is Splunk running?')
      }
    } else {
      try {
        const alerts = JSON.parse(customAlerts)
        if (!Array.isArray(alerts)) {
          setError('Must be a JSON array of alert objects')
          return
        }
        onAnalyzeAlerts(alerts, false)
      } catch (e) {
        setError('Invalid JSON. Check your syntax.')
      }
    }
  }

  const handleFetchSplunk = async () => {
    setError(null)
    setSplunkMode(true)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        Attack Scenarios
      </h2>

      <div className="space-y-2 mb-6">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleScenarioClick(s.id, s.label)}
            disabled={isRunning}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg
                       hover:border-green-400/50 hover:bg-gray-800 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed text-left group"
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-sm text-gray-300 group-hover:text-green-400 transition-colors">
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Custom Alerts (JSON)
        </h3>
        <textarea
          value={customAlerts}
          onChange={(e) => setCustomAlerts(e.target.value)}
          placeholder='[{"_time": "2026-06-07 10:00:00", "src_ip": "10.0.0.5", ...}]'
          disabled={isRunning || splunkMode}
          className="w-full h-28 bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs font-mono
                     text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-green-400/50
                     disabled:opacity-50"
        />
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-gray-500">Use Live Splunk</span>
        <button
          onClick={() => setSplunkMode(!splunkMode)}
          disabled={isRunning}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            splunkMode ? 'bg-green-400' : 'bg-gray-700'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              splunkMode ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={isRunning || (!splunkMode && !customAlerts.trim())}
        className="w-full py-3 bg-green-400/10 border border-green-400/30 text-green-400 rounded-lg
                   text-sm font-semibold hover:bg-green-400/20 hover:border-green-400/50
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Analyzing...' : splunkMode ? 'Fetch & Analyze' : 'Analyze Threats'}
      </button>
    </div>
  )
}
