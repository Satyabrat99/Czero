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
  const [activeTab, setActiveTab] = useState<'reddit' | 'email' | 'linkedin'>('reddit')
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    const storedLeads = localStorage.getItem('czero_leads')
    
    // In case leads are in localStorage (from search test)
    if (storedLeads) {
      try {
        const leads = JSON.parse(storedLeads)
        const index = parseInt(params.leadId as string)
        if (leads[index]) {
          setLead(leads[index])
          
          // Set default tab based on drafts available
          const item = leads[index]
          if (item.reddit_reply_draft) setActiveTab('reddit')
          else if (item.email_draft) setActiveTab('email')
          else if (item.linkedin_dm_draft) setActiveTab('linkedin')
          
          setLoading(false)
          return
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    // If not in localStorage, try fetching from backend for this user's active product
    const fetchLeadFromBackend = async () => {
      try {
        const storedProduct = localStorage.getItem('czero_product')
        if (storedProduct) {
          const product = JSON.parse(storedProduct)
          if (product.id) {
            const response = await fetch(`http://localhost:8000/api/leads?product_id=${product.id}`)
            if (response.ok) {
              const data = await response.json()
              const index = parseInt(params.leadId as string)
              if (data.leads && data.leads[index]) {
                const item = data.leads[index]
                setLead(item)
                
                // Set default tab
                if (item.reddit_reply_draft) setActiveTab('reddit')
                else if (item.email_draft) setActiveTab('email')
                else if (item.linkedin_dm_draft) setActiveTab('linkedin')
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching lead detail:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeadFromBackend()
  }, [params.leadId])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-obsidian-ink flex items-center justify-center">
        <div className="animate-pulse font-medium text-fog tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-obsidian-ink rounded-full animate-bounce"></span>
          <span>Loading lead context...</span>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-canvas text-obsidian-ink p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-fog">Lead not found</p>
          <Link href="/dashboard" className="bg-obsidian-ink text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-obsidian-ink/90 transition inline-block">
            ← Back to Feed
          </Link>
        </div>
      </div>
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Get active draft text
  const getActiveDraft = () => {
    if (activeTab === 'reddit') return lead.reddit_reply_draft
    if (activeTab === 'email') return lead.email_draft
    if (activeTab === 'linkedin') return lead.linkedin_dm_draft
    return ''
  }

  return (
    <div className="min-h-screen bg-canvas text-obsidian-ink flex flex-col antialiased">
      {/* Main Container */}
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-6 sm:px-12 py-12 space-y-10">
        
        {/* Header Metadata Block */}
        <div className="border-b border-obsidian-ink/10 pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                lead.category === 'hot' ? 'bg-red-50 border-red-200 text-red-600' :
                lead.category === 'warm' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                'bg-zinc-50 border-zinc-200 text-zinc-600'
              }`}>
                {lead.category}
              </span>
              
              <span className="font-semibold text-obsidian-ink/80 capitalize inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-obsidian-ink/30 rounded-full"></span>
                {lead.source}
              </span>
              
              {lead.author_username && (
                <span className="text-fog">by @{lead.author_username}</span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-display tracking-tight text-obsidian-ink leading-[1.05]">
              Lead Relevance: {lead.final_score}%
            </h1>
          </div>

          <a
            href={lead.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-obsidian-ink text-obsidian-ink hover:bg-obsidian-ink hover:text-white font-medium text-xs px-5 py-2.5 rounded-full transition self-start sm:self-auto inline-flex items-center gap-1"
          >
            Open Original Post <span className="font-sans">↗</span>
          </a>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Post and Reasoning */}
          <div className="md:col-span-2 space-y-8">
            <div className="border border-obsidian-ink/10 rounded-lg p-6 bg-white space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Scraped Discussion</h3>
              <p className="text-obsidian-ink font-sans text-sm leading-relaxed whitespace-pre-wrap">
                "{lead.text}"
              </p>
            </div>

            <div className="border border-obsidian-ink/10 rounded-lg p-6 bg-white space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fog">AI Reasoning</h3>
              <p className="text-obsidian-ink font-sans text-sm leading-relaxed">
                {lead.reasoning}
              </p>
            </div>
          </div>

          {/* Right Column: Contact info & metadata */}
          <div className="space-y-8">
            <div className="border border-obsidian-ink/10 rounded-lg p-6 bg-white space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Contact Details</h3>
              
              {lead.email || lead.linkedin_url ? (
                <div className="space-y-3 text-xs">
                  {lead.email && (
                    <div>
                      <div className="text-[10px] font-bold text-fog uppercase mb-1">Enriched Email</div>
                      <a href={`mailto:${lead.email}`} className="text-iris-pulse hover:underline text-sm font-semibold">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.linkedin_url && (
                    <div>
                      <div className="text-[10px] font-bold text-fog uppercase mb-1">LinkedIn Profile</div>
                      <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-iris-pulse hover:underline text-sm font-semibold truncate block">
                        {lead.linkedin_url}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-fog italic">
                  No direct email/profile enriched for this signal. Use social reply drafts below to engage.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Outreach Draft Section (Tabs) */}
        {(lead.reddit_reply_draft || lead.email_draft || lead.linkedin_dm_draft) && (
          <div className="border border-obsidian-ink/10 rounded-lg bg-white shadow-sm overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-obsidian-ink/10 bg-zinc-50">
              {lead.reddit_reply_draft && (
                <button
                  onClick={() => setActiveTab('reddit')}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'reddit' 
                      ? 'bg-white border-r border-obsidian-ink/10 border-t-2 border-t-obsidian-ink text-obsidian-ink' 
                      : 'text-fog hover:text-obsidian-ink'
                  }`}
                >
                  Reddit Reply Draft
                </button>
              )}
              {lead.email_draft && (
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'email' 
                      ? 'bg-white border-r border-l border-obsidian-ink/10 border-t-2 border-t-obsidian-ink text-obsidian-ink' 
                      : 'text-fog hover:text-obsidian-ink'
                  }`}
                >
                  Cold Email Draft
                </button>
              )}
              {lead.linkedin_dm_draft && (
                <button
                  onClick={() => setActiveTab('linkedin')}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'linkedin' 
                      ? 'bg-white border-l border-obsidian-ink/10 border-t-2 border-t-obsidian-ink text-obsidian-ink' 
                      : 'text-fog hover:text-obsidian-ink'
                  }`}
                >
                  LinkedIn DM Draft
                </button>
              )}
            </div>

            {/* Tab Content Box */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-fog uppercase tracking-wider">
                  AI Generated Outreach Draft
                </span>
                
                <button
                  onClick={() => copyToClipboard(getActiveDraft() || '')}
                  className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition flex items-center gap-1.5"
                >
                  {copySuccess ? 'Copied! ✓' : 'Copy Draft'}
                </button>
              </div>

              <div className="p-4 bg-zinc-50 border border-obsidian-ink/10 rounded-lg text-sm text-obsidian-ink font-mono whitespace-pre-wrap leading-relaxed">
                {getActiveDraft() || "No draft available for this channel."}
              </div>
            </div>
          </div>
        )}

        {/* 4. feedback buttons */}
        <div className="border-t border-obsidian-ink/10 pt-8 flex items-center justify-between">
          <span className="text-xs text-fog">Was this signal match useful for your ICP?</span>
          <div className="flex gap-3">
            <button className="border border-obsidian-ink hover:bg-obsidian-ink hover:text-white text-obsidian-ink px-5 py-2 rounded-full text-xs font-bold transition">
              Helpful ✓
            </button>
            <button className="border border-obsidian-ink hover:bg-obsidian-ink hover:text-white text-obsidian-ink px-5 py-2 rounded-full text-xs font-bold transition">
              Not Helpful ✕
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
