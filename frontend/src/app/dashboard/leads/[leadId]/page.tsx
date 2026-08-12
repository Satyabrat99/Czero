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
      <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex items-center justify-center">
        <div className="animate-pulse font-medium text-[#547067] tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#072720] rounded-full animate-bounce"></span>
          <span>Loading lead context...</span>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] text-[#072720] p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[#547067]">Lead not found</p>
          <Link href="/dashboard" className="bg-[#072720] text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-[#0d3c30] transition inline-block">
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
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col antialiased bg-grid-dots">
      {/* Main Container */}
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-6 sm:px-12 py-12 space-y-8">
        
        {/* Header Metadata Block */}
        <div className="border-b border-[#e0ebe6] pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                lead.category === 'hot' ? 'bg-[#fbf7e8] border-[#d4af37]/60 text-[#a88720]' :
                lead.category === 'warm' ? 'bg-[#ebf2ee] border-[#10b981]/40 text-[#072720]' :
                'bg-[#f4f7f5] border-[#e0ebe6] text-[#547067]'
              }`}>
                {lead.category === 'hot' ? '🔥 Hot Buyer Intent' : lead.category}
              </span>
              
              <span className="font-semibold text-[#072720] capitalize inline-flex items-center gap-1.5 font-mono text-xs">
                <span className="w-1.5 h-1.5 bg-[#072720]/40 rounded-full"></span>
                {lead.source}
              </span>
              
              {lead.author_username && (
                <span className="text-[#547067] font-mono text-xs">by @{lead.author_username}</span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-display tracking-tight text-[#072720] leading-[1.05]">
              Lead Relevance: {lead.final_score}%
            </h1>
          </div>

          <a
            href={lead.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#072720] text-[#072720] hover:bg-[#072720] hover:text-white font-semibold text-xs px-5 py-2.5 rounded-full transition self-start sm:self-auto inline-flex items-center gap-1.5 shadow-xs"
          >
            Open Original Post ↗
          </a>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Post and Reasoning */}
          <div className="md:col-span-2 space-y-6">
            <div className="border border-[#e0ebe6] rounded-2xl p-6 bg-white space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#547067]">Scraped Discussion</h3>
              <p className="text-[#072720] font-sans text-sm leading-relaxed whitespace-pre-wrap font-medium">
                "{lead.text}"
              </p>
            </div>

            <div className="border border-[#e0ebe6] rounded-2xl p-6 bg-white space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#547067]">AI Reasoning & Intent Breakdown</h3>
              <p className="text-[#072720] font-sans text-sm leading-relaxed">
                {lead.reasoning}
              </p>
            </div>
          </div>

          {/* Right Column: Contact info & metadata */}
          <div className="space-y-6">
            <div className="border border-[#e0ebe6] rounded-2xl p-6 bg-white space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#547067]">Contact Details</h3>
              
              {lead.email || lead.linkedin_url ? (
                <div className="space-y-3 text-xs">
                  {lead.email && (
                    <div>
                      <div className="text-[10px] font-bold text-[#547067] uppercase mb-1">Enriched Email</div>
                      <a href={`mailto:${lead.email}`} className="text-[#072720] hover:text-[#d4af37] text-sm font-semibold underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.linkedin_url && (
                    <div>
                      <div className="text-[10px] font-bold text-[#547067] uppercase mb-1">LinkedIn Profile</div>
                      <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[#072720] hover:text-[#d4af37] text-sm font-semibold truncate block underline">
                        {lead.linkedin_url}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#547067] italic">
                  No direct email/profile enriched for this signal. Use social reply drafts below to engage directly on thread.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Outreach Draft Section (Tabs) */}
        {(lead.reddit_reply_draft || lead.email_draft || lead.linkedin_dm_draft) && (
          <div className="border border-[#e0ebe6] rounded-2xl bg-white shadow-xs overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-[#e0ebe6] bg-[#f4f7f5]">
              {lead.reddit_reply_draft && (
                <button
                  onClick={() => setActiveTab('reddit')}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'reddit' 
                      ? 'bg-white border-r border-[#e0ebe6] border-t-2 border-t-[#072720] text-[#072720]' 
                      : 'text-[#547067] hover:text-[#072720]'
                  }`}
                >
                  Reddit Reply Draft
                </button>
              )}
              {lead.email_draft && (
                <button
                  onClick={() => setActiveTab('email')}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'email' 
                      ? 'bg-white border-r border-l border-[#e0ebe6] border-t-2 border-t-[#072720] text-[#072720]' 
                      : 'text-[#547067] hover:text-[#072720]'
                  }`}
                >
                  Cold Email Draft
                </button>
              )}
              {lead.linkedin_dm_draft && (
                <button
                  onClick={() => setActiveTab('linkedin')}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === 'linkedin' 
                      ? 'bg-white border-l border-[#e0ebe6] border-t-2 border-t-[#072720] text-[#072720]' 
                      : 'text-[#547067] hover:text-[#072720]'
                  }`}
                >
                  LinkedIn DM Draft
                </button>
              )}
            </div>

            {/* Tab Content Box */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#547067] uppercase tracking-wider font-mono">
                  AI Generated Outreach Draft
                </span>
                
                <button
                  onClick={() => copyToClipboard(getActiveDraft() || '')}
                  className="bg-[#072720] hover:bg-[#0d3c30] text-white text-xs font-semibold px-4 py-2 rounded-full transition flex items-center gap-1.5 shadow-sm"
                >
                  {copySuccess ? 'Copied! ✓' : 'Copy Draft'}
                </button>
              </div>

              <div className="p-4 bg-[#f8faf8] border border-[#e0ebe6] rounded-xl text-sm text-[#072720] font-mono whitespace-pre-wrap leading-relaxed">
                {getActiveDraft() || "No draft available for this channel."}
              </div>
            </div>
          </div>
        )}

        {/* 4. Feedback Buttons */}
        <div className="border-t border-[#e0ebe6] pt-8 flex items-center justify-between">
          <span className="text-xs text-[#547067]">Was this signal match useful for your ICP?</span>
          <div className="flex gap-3">
            <button className="border border-[#072720] hover:bg-[#072720] hover:text-white text-[#072720] px-5 py-2 rounded-full text-xs font-bold transition">
              Helpful ✓
            </button>
            <button className="border border-[#072720] hover:bg-[#072720] hover:text-white text-[#072720] px-5 py-2 rounded-full text-xs font-bold transition">
              Not Helpful ✕
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

