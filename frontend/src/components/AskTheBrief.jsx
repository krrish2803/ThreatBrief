import { useState } from 'react'
import { API_URL } from '../config'

const SUGGESTIONS = [
  'What should I isolate first?',
  'Why is this critical?',
  'What data was stolen?',
]

export default function AskTheBrief({ jobId, brief }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const isDisabled = !brief || !jobId

  const handleSubmit = async (q) => {
    const query = q || question
    if (!query.trim() || isDisabled) return

    setMessages((prev) => [...prev, { role: 'user', text: query }])
    setLoading(true)
    setQuestion('')

    try {
      const res = await fetch(`${API_URL}/api/brief/${jobId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }])
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an error processing your question.' },
      ])
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg border-t-2 border-t-green-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ask The Brief</h3>
      </div>

      <div className="px-4 py-3">
        {messages.length > 0 && (
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-green-400/10 border border-green-400/20 text-gray-200'
                      : 'bg-gray-800 border border-gray-700 text-gray-300'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isDisabled && messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuestion(s)}
                className="text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2.5 py-1.5 rounded
                           hover:border-green-400/30 hover:text-green-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Complete analysis first...' : 'Ask about this incident...'}
            disabled={isDisabled || loading}
            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300
                       placeholder-gray-600 focus:outline-none focus:border-green-400/50 disabled:opacity-50"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isDisabled || loading || !question.trim()}
            className="px-4 py-2 bg-green-400/10 border border-green-400/30 text-green-400 rounded-lg
                       text-sm font-semibold hover:bg-green-400/20 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
