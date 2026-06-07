import { useState, useCallback, useEffect, useRef } from 'react'
import { API_URL } from './config'
import AlertInput from './components/AlertInput'
import PipelineStatus from './components/PipelineStatus'
import IncidentBrief from './components/IncidentBrief'
import MitreBadges from './components/MitreBadges'
import Timeline from './components/Timeline'
import IOCTable from './components/IOCTable'
import ConfidenceScore from './components/ConfidenceScore'
import AskTheBrief from './components/AskTheBrief'

export default function App() {
  const [jobId, setJobId] = useState(null)
  const [brief, setBrief] = useState(null)
  const [currentAgent, setCurrentAgent] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [scenarioName, setScenarioName] = useState(null)
  const eventSourceRef = useRef(null)

  const connectSSE = useCallback((id) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    const es = new EventSource(`${API_URL}/api/stream/${id}`)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'agent_update') {
          setCurrentAgent(data.agent)
          if (data.status === 'running') {
            setIsRunning(true)
          }
        } else if (data.event === 'complete') {
          setBrief(data.data)
          setCurrentAgent(null)
          setIsRunning(false)
          es.close()
          eventSourceRef.current = null
        } else if (data.event === 'error') {
          setIsRunning(false)
          setCurrentAgent(null)
          es.close()
          eventSourceRef.current = null
        }
      } catch (e) {
        console.error('SSE parse error', e)
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      setIsRunning(false)
      setCurrentAgent(null)
    }
  }, [])

  const handleRunScenario = useCallback(async (scenarioId, name) => {
    setIsRunning(true)
    setBrief(null)
    setCurrentAgent('ingestor')
    setScenarioName(name)
    try {
      const res = await fetch(`${API_URL}/api/scenarios/${scenarioId}/run`, {
        method: 'POST',
      })
      const data = await res.json()
      setJobId(data.job_id)
      connectSSE(data.job_id)
    } catch (e) {
      setIsRunning(false)
      setCurrentAgent(null)
    }
  }, [connectSSE])

  const handleAnalyzeAlerts = useCallback(async (alerts, fromSplunk) => {
    setIsRunning(true)
    setBrief(null)
    setCurrentAgent('ingestor')
    setScenarioName(fromSplunk ? 'Live Splunk Analysis' : 'Custom Alert Analysis')
    try {
      const res = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts, splunk_mode: fromSplunk }),
      })
      const data = await res.json()
      setJobId(data.job_id)
      connectSSE(data.job_id)
    } catch (e) {
      setIsRunning(false)
      setCurrentAgent(null)
    }
  }, [connectSSE])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-green-900/40 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-green-400 flex items-center justify-center">
              <span className="text-green-400 text-lg font-bold">TB</span>
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-white">
              Threat<span className="text-green-400">Brief</span>
            </h1>
            {scenarioName && (
              <span className="text-gray-500 text-sm ml-2 border-l border-gray-800 pl-2">
                {scenarioName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">System Online</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="w-1/4 flex-shrink-0 space-y-4">
            <AlertInput
              onRunScenario={handleRunScenario}
              onAnalyzeAlerts={handleAnalyzeAlerts}
              isRunning={isRunning}
            />
          </div>

          <div className="flex-1 space-y-4">
            <PipelineStatus currentAgent={currentAgent} isRunning={isRunning} />
            <IncidentBrief brief={brief} isRunning={isRunning} />
            <AskTheBrief jobId={jobId} brief={brief} />
          </div>

          <div className="w-[30%] flex-shrink-0 space-y-4">
            {brief && (
              <>
                <ConfidenceScore score={brief.confidence_score} reasoning={brief.confidence_reasoning} />
                <MitreBadges techniques={brief.mitre_mapping} />
                <IOCTable iocs={brief.ioc_list} />
                <Timeline events={brief.timeline} />
              </>
            )}
            {isRunning && !brief && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">Analysis in progress...</p>
              </div>
            )}
            {!isRunning && !brief && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">Select a scenario or paste alerts to begin</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
