'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/api'

interface Lead {
  id: string
  score: number
  text: string
  source: string
  status: string
  created_at: string
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiGet('/api/leads')
      .then((data) => {
        setLeads(data.leads || [])
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Leads</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse border-l-4 border-gray-700 p-4 rounded bg-gray-900"
            >
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Leads</h1>
      <p className="text-gray-400 mb-8">
        People actively looking for your product.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {leads.length === 0 && !error ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">No leads yet</h2>
          <p className="text-gray-400 mb-6">
            We&apos;re scanning the web for people who need your product.
          </p>
          <p className="text-gray-500 text-sm">
            First leads appear within 24 hours.
          </p>
          <a
            href="/dashboard/settings"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Configure monitoring →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`border-l-4 p-4 rounded ${
                lead.score >= 80
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-yellow-500 bg-yellow-500/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`font-bold ${
                    lead.score >= 80 ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  {lead.score >= 80 ? 'HOT' : 'WARM'} {lead.score}%
                </span>
                <span className="text-gray-500 text-sm">
                  {lead.source} · {lead.created_at}
                </span>
              </div>
              <p className="text-white">&quot;{lead.text}&quot;</p>
              <button className="mt-2 text-blue-400 text-sm hover:underline">
                View →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
