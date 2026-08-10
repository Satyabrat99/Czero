'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  email_draft?: string
  linkedin_dm_draft?: string
  reddit_reply_draft?: string
}

export default function LeadDetail() {
  const params = useParams()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedLeads = localStorage.getItem('czero_leads')
    if (storedLeads) {
      const leads = JSON.parse(storedLeads)
      const index = parseInt(params.leadId as string)
      if (leads[index]) {
        setLead(leads[index])
      }
    }
    setLoading(false)
  }, [params.leadId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p className="text-gray-400">Lead not found</p>
        <Link href="/dashboard" className="text-blue-400 hover:underline mt-4 inline-block">
          Back to leads
        </Link>
      </div>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Link href="/dashboard" className="text-blue-400 hover:underline mb-4 inline-block">
        Back to leads
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              lead.category === 'hot' ? 'bg-red-500/20 text-red-400' :
              lead.category === 'warm' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {lead.category === 'hot' ? 'HOT' :
               lead.category === 'warm' ? 'WARM' : 'COLD'}
            </span>
            <span className="text-gray-500">{lead.source}</span>
            <span className="text-gray-500">by {lead.author_username}</span>
          </div>
          <h1 className="text-xl font-bold">Score: {lead.final_score}%</h1>
        </div>
        <a
          href={lead.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          View Original
        </a>
      </div>

      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Post</h2>
        <p className="text-white whitespace-pre-wrap">{lead.text}</p>
      </div>

      <div className="bg-gray-900 p-4 rounded mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-2">Why This Lead</h2>
        <p className="text-white">{lead.reasoning}</p>
      </div>

      {(lead.email || lead.linkedin_url) && (
        <div className="bg-gray-900 p-4 rounded mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-2">Contact Info</h2>
          {lead.email && (
            <p className="text-white mb-1">
              <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline">{lead.email}</a>
            </p>
          )}
          {lead.linkedin_url && (
            <p className="text-white">
              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{lead.linkedin_url}</a>
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {lead.email_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">Email Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.email_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.email_draft}</p>
          </div>
        )}

        {lead.linkedin_dm_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">LinkedIn DM Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.linkedin_dm_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.linkedin_dm_draft}</p>
          </div>
        )}

        {lead.reddit_reply_draft && (
          <div className="bg-gray-900 p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium text-gray-400">Reddit Reply Draft</h2>
              <button
                onClick={() => copyToClipboard(lead.reddit_reply_draft!)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="text-white whitespace-pre-wrap">{lead.reddit_reply_draft}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium">
          Useful
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-medium">
          Not Useful
        </button>
      </div>
    </div>
  )
}
