'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Lead {
  source: string
  source_url: string
  author_username: string
  text: string
  final_score: number
  category: string
  reasoning: string
  email?: string
  linkedin_url?: string
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedLeads = localStorage.getItem('czero_leads')
    const storedStats = localStorage.getItem('czero_stats')

    if (storedLeads) {
      setLeads(JSON.parse(storedLeads))
    }
    if (storedStats) {
      setStats(JSON.parse(storedStats))
    }
    setLoading(false)
  }, [])

  const hotLeads = leads.filter(l => l.category === 'hot')
  const warmLeads = leads.filter(l => l.category === 'warm')

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Your Leads</h1>
        <p className="text-gray-400 mb-8">No leads yet. Configure your product in Settings.</p>
        <Link
          href="/dashboard/settings"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium inline-block"
        >
          Go to Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Your Leads</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-blue-500">{(stats.total as number) || leads.length}</div>
          <div className="text-gray-400">Total Leads</div>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-red-500">{hotLeads.length}</div>
          <div className="text-gray-400">Hot Leads</div>
        </div>
        <div className="bg-gray-900 p-4 rounded">
          <div className="text-3xl font-bold text-yellow-500">{warmLeads.length}</div>
          <div className="text-gray-400">Warm Leads</div>
        </div>
      </div>

      <div className="space-y-4">
        {leads.map((lead, i) => (
          <Link
            key={i}
            href={`/dashboard/leads/${i}`}
            className="block bg-gray-900 p-4 rounded hover:bg-gray-800 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    lead.category === 'hot' ? 'bg-red-500/20 text-red-400' :
                    lead.category === 'warm' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {lead.category === 'hot' ? 'HOT' :
                     lead.category === 'warm' ? 'WARM' : 'COLD'}
                  </span>
                  <span className="text-gray-500 text-sm">{lead.source}</span>
                </div>
                <p className="text-white mb-2 line-clamp-2">{lead.text}</p>
                <p className="text-gray-500 text-sm">{lead.reasoning}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-blue-500">{lead.final_score}%</div>
                <div className="text-gray-500 text-xs">score</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
