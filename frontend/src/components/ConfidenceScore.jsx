import { useState, useEffect } from 'react'

export default function ConfidenceScore({ score, reasoning }) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    if (score === null || score === undefined) return
    const duration = 1000
    const steps = 30
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.round(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [score])

  const getColor = () => {
    if (animatedScore < 40) return { stroke: '#ef4444', text: 'text-red-400' }
    if (animatedScore < 70) return { stroke: '#fb923c', text: 'text-orange-400' }
    return { stroke: '#4ade80', text: 'text-green-400' }
  }

  if (score === null || score === undefined) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Confidence Score</h3>
        <p className="text-gray-600 text-xs">Not yet calculated</p>
      </div>
    )
  }

  const color = getColor()
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Confidence Score</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64" cy="64" r={radius}
              fill="none" stroke="#1f2937" strokeWidth="10"
            />
            <circle
              cx="64" cy="64" r={radius}
              fill="none" stroke={color.stroke} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${color.text}`}>
              {animatedScore}
            </span>
          </div>
        </div>
        {reasoning && (
          <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">{reasoning}</p>
        )}
      </div>
    </div>
  )
}
