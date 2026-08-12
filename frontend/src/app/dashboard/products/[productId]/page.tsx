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
}

export default function ProductDashboard() {
  const params = useParams()
  const productId = params.productId as string

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [productName, setProductName] = useState('')
  const [productUrl, setProductUrl] = useState('')
  
  // Real-time scan & countdown states
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [scanResult, setScanResult] = useState('')
  const [countdown, setCountdown] = useState(900) // 15 minutes = 900 seconds
  const [lastChecked, setLastChecked] = useState<string>('Just now')
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'warm'>('all')

  const fetchLeads = async () => {
    if (!productId) return
    try {
      const storedProduct = localStorage.getItem('czero_product')
      if (storedProduct) {
        try {
          const product = JSON.parse(storedProduct)
          if (product.id === productId) {
            setProductName(product.name || 'Your Product')
            setProductUrl(product.url || '')
          }
        } catch (e) {
          console.error(e)
        }
      }

      const response = await fetch(`http://localhost:8000/api/leads?product_id=${productId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }

      const data = await response.json()
      setLeads(data.leads || [])
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setCountdown(900) // Reset 15-min countdown on fresh fetch
    } catch (err) {
      console.error("Error fetching leads from database:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()

    // Auto-refresh leads list every 15 seconds to pull new background arrivals
    const interval = setInterval(fetchLeads, 15000)
    return () => clearInterval(interval)
  }, [productId])

  // Live 15-minute countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 900))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Trigger manual sync sweep
  const handleManualScan = async () => {
    if (!productId) return

    try {
      setIsScanning(true)
      setScanResult('')
      
      const tickers = [
        "Initializing radar sweep...",
        "Scanning Reddit subreddits (r/SaaS, r/startups)...",
        "Querying Hacker News Algolia index...",
        "Scouring Lobste.rs & Dev.to tech feeds...",
        "Executing Exa semantic web search...",
        "Running Llama 3.1 intent classifier...",
        "Sanitizing spam and freelancer posts...",
        "Enriching buyer contacts & drafting replies..."
      ]

      let tickerIndex = 0
      setScanStatus(tickers[0])
      const tickerInterval = setInterval(() => {
        tickerIndex = (tickerIndex + 1) % tickers.length
        setScanStatus(tickers[tickerIndex])
      }, 2000)

      const response = await fetch('http://localhost:8000/api/products/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId })
      })

      clearInterval(tickerInterval)

      if (!response.ok) {
        throw new Error('Failed to run monitoring scan')
      }

      const data = await response.json()
      
      // Re-fetch leads list immediately
      await fetchLeads()
      setScanResult(data.message || 'Scan completed successfully.')
      setTimeout(() => setScanResult(''), 5000)

    } catch (err) {
      console.error(err)
      setScanResult('Error occurred during scanning sweep.')
      setTimeout(() => setScanResult(''), 5000)
    } finally {
      setIsScanning(false)
      setScanStatus('')
    }
  }

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const hotLeads = leads.filter(l => l.category === 'hot')
  const warmLeads = leads.filter(l => l.category === 'warm')

  const filteredLeads = activeTab === 'hot' ? hotLeads : activeTab === 'warm' ? warmLeads : leads

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-obsidian-ink flex items-center justify-center">
        <div className="animate-pulse font-medium text-fog tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-obsidian-ink rounded-full animate-bounce"></span>
          <span>Loading leads workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-obsidian-ink flex flex-col antialiased">
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-12 py-10">
        
        {/* Top Navigation Back Bar */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-semibold text-fog hover:text-obsidian-ink transition inline-flex items-center gap-1">
            ← Back to Workspaces
          </Link>
        </div>

        {/* 1. Header Block */}
        <div className="mb-8 border-b border-obsidian-ink/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl sm:text-5xl font-display tracking-tight text-obsidian-ink">
                {productName || 'Product Feed'}
              </h1>
              {productUrl && (
                <a href={productUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-fog hover:text-obsidian-ink underline">
                  {productUrl.replace('https://', '').replace('http://', '').replace('www.', '')}
                </a>
              )}
            </div>
            <p className="text-fog max-w-xl text-sm leading-relaxed">
              Social listening radar monitoring Reddit, Hacker News, Lobste.rs, Dev.to, and Exa web feeds for active buyers.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium text-xs px-5 py-2.5 rounded-full transition disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
            >
              {isScanning ? (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                  Scanning Web...
                </>
              ) : (
                <>
                  <span>Sweep Now</span>
                  <span className="text-xs">⟳</span>
                </>
              )}
            </button>
            <Link href="/dashboard/settings" className="border border-obsidian-ink/20 hover:border-obsidian-ink text-obsidian-ink font-medium text-xs px-4 py-2.5 rounded-full transition">
              Settings
            </Link>
          </div>
        </div>

        {/* 2. LIVE BACKGROUND MONITORING STATUS BAR */}
        <div className="bg-white border border-obsidian-ink/10 rounded-xl p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-8 h-8">
              <span className="absolute w-7 h-7 rounded-full bg-emerald-500/20 animate-ping"></span>
              <span className="w-3 h-3 bg-emerald-500 rounded-full relative z-10"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-obsidian-ink uppercase tracking-wider">Background Monitoring Active</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  15m Polling
                </span>
              </div>
              <p className="text-xs text-fog mt-0.5">
                Automatically scanning 9 sources every 15 minutes • Last checked: <span className="font-medium text-obsidian-ink">{lastChecked}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 border-obsidian-ink/10 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[10px] font-bold text-fog uppercase tracking-wider">Next Auto-Sweep</div>
              <div className="text-sm font-mono font-bold text-obsidian-ink tracking-tight">{formatCountdown(countdown)}</div>
            </div>
            <div className="w-px h-8 bg-obsidian-ink/10 hidden sm:block"></div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-fog uppercase tracking-wider">Status</div>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                <span>Listening</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan Result Notice Banner */}
        {scanResult && (
          <div className="bg-obsidian-ink/5 border border-obsidian-ink/10 text-obsidian-ink px-4 py-3 rounded-lg text-xs font-semibold mb-6 flex justify-between items-center animate-fade-in">
            <span>{scanResult}</span>
            <button onClick={() => setScanResult('')} className="text-fog hover:text-obsidian-ink">✕</button>
          </div>
        )}

        {/* Live Radar Sweep Progress Box */}
        {isScanning && (
          <div className="border border-emerald-500/30 bg-emerald-50/50 rounded-xl p-5 mb-8 flex items-center gap-4 animate-pulse">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <span className="absolute w-8 h-8 rounded-full border border-emerald-500 animate-ping"></span>
              <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full"></span>
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Live Sweep Running</div>
              <div className="text-xs font-medium text-obsidian-ink mt-0.5">{scanStatus}</div>
            </div>
          </div>
        )}

        {/* 3. Editorial Metrics & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-white border border-obsidian-ink/10 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'all'
                  ? 'bg-obsidian-ink text-white shadow-sm'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'hot'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              <span>🔥 Hot</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'hot' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                {hotLeads.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('warm')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'warm'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              <span>⚡ Warm</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'warm' ? 'bg-white/20 text-white' : 'bg-amber-600'}`}>
                {warmLeads.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-fog self-center">
            Showing <span className="font-semibold text-obsidian-ink">{filteredLeads.length}</span> results
          </div>
        </div>

        {/* 4. Leads Feed List */}
        {filteredLeads.length === 0 ? (
          <div className="border border-obsidian-ink/10 rounded-xl p-12 text-center bg-white">
            <div className="relative flex items-center justify-center w-24 h-24 mx-auto mb-4">
              <span className="w-16 h-16 rounded-full border border-obsidian-ink/10 animate-ping"></span>
              <span className="w-3 h-3 bg-obsidian-ink/40 rounded-full"></span>
            </div>
            <h3 className="text-2xl font-display text-obsidian-ink mb-2">No matching leads in this filter</h3>
            <p className="text-fog text-xs max-w-sm mx-auto mb-6">
              Background scheduler is scanning 9 sources every 15 minutes. Check back soon or trigger a manual sweep.
            </p>
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white text-xs font-medium px-5 py-2.5 rounded-full transition disabled:opacity-50"
            >
              Sweep Now ⟳
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead, i) => (
              <div
                key={i}
                className="bg-white border border-obsidian-ink/10 hover:border-obsidian-ink/25 rounded-xl p-6 transition shadow-sm relative overflow-hidden group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Meta Badge Row */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        lead.category === 'hot' ? 'bg-red-50 border-red-200 text-red-700' :
                        lead.category === 'warm' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}>
                        {lead.category === 'hot' ? '🔥 Hot Intent' : lead.category === 'warm' ? '⚡ Warm Lead' : lead.category}
                      </span>
                      
                      <span className="font-semibold text-obsidian-ink/80 capitalize border border-obsidian-ink/10 bg-canvas px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-obsidian-ink/40 rounded-full"></span>
                        {lead.source}
                      </span>

                      {lead.author_username && lead.author_username !== 'unknown' && (
                        <span className="text-fog text-[11px]">by @{lead.author_username}</span>
                      )}
                    </div>

                    {/* Post Text */}
                    <p className="text-obsidian-ink text-sm leading-relaxed font-sans font-normal">
                      "{lead.text}"
                    </p>

                    {/* AI Intent Reasoning */}
                    <div className="bg-canvas/50 border-l-2 border-obsidian-ink/20 p-3 rounded-r-lg text-xs text-fog leading-relaxed italic">
                      <span className="font-semibold not-italic text-obsidian-ink/80 mr-1">AI Score Reason:</span>
                      {lead.reasoning}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 pt-1 text-xs">
                      {lead.source_url && (
                        <a
                          href={lead.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-obsidian-ink hover:underline inline-flex items-center gap-1"
                        >
                          Open Thread <span className="text-[10px]">↗</span>
                        </a>
                      )}

                      <Link
                        href={`/dashboard/leads/${i}`}
                        className="text-fog hover:text-obsidian-ink transition font-medium"
                      >
                        View AI Reply Draft →
                      </Link>
                    </div>
                  </div>

                  {/* Relevance Score Pill */}
                  <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 border-obsidian-ink/5 pt-3 md:pt-0 shrink-0">
                    <div className="text-3xl font-display text-obsidian-ink font-bold leading-none">
                      {lead.final_score}%
                    </div>
                    <div className="text-fog text-[9px] font-bold uppercase tracking-wider mt-1">relevance</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

