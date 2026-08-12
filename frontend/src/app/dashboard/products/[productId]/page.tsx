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

// Client-side HTML Entity Decoder & Tag Stripper
const sanitizeText = (rawText: string): string => {
  if (!rawText) return ''
  let cleaned = rawText
    .replace(/&#x2F;/g, '/')
    .replace(/&#x2f;/g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Strip raw HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ')
  // Normalize whitespace
  return cleaned.replace(/\s+/g, ' ').trim()
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
  const [countdown, setCountdown] = useState(900)
  const [lastChecked, setLastChecked] = useState<string>('Just now')
  const [activeTab, setActiveTab] = useState<'all' | 'hot' | 'warm'>('all')

  // Synchronize next sweep target time globally in localStorage
  const getOrInitSweepTarget = (): number => {
    if (typeof window === 'undefined') return Date.now() + 900000
    const storedTarget = localStorage.getItem('czero_next_sweep_target')
    if (storedTarget) {
      const targetTime = parseInt(storedTarget, 10)
      if (targetTime > Date.now()) {
        return targetTime
      }
    }
    const newTarget = Date.now() + 900000 // 15 minutes = 900,000 ms
    localStorage.setItem('czero_next_sweep_target', newTarget.toString())
    return newTarget
  }

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
      const rawLeads: Lead[] = data.leads || []
      
      // Sanitize lead text dynamically on fetch
      const cleanedLeads = rawLeads.map(lead => ({
        ...lead,
        text: sanitizeText(lead.text),
        reasoning: sanitizeText(lead.reasoning)
      }))

      setLeads(cleanedLeads)
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      console.error("Error fetching leads from database:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
    const interval = setInterval(fetchLeads, 15000)
    return () => clearInterval(interval)
  }, [productId])

  // Persistent 15-minute countdown ticker tied to target timestamp
  useEffect(() => {
    const updateCountdown = () => {
      const target = getOrInitSweepTarget()
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setCountdown(diff)
      if (diff === 0) {
        const newTarget = Date.now() + 900000
        localStorage.setItem('czero_next_sweep_target', newTarget.toString())
        fetchLeads()
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
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
        <div className="font-mono text-xs text-fog flex items-center space-x-3 bg-white px-6 py-4 rounded-full border border-ash shadow-sm">
          <span className="w-2.5 h-2.5 bg-iris-pulse rounded-full animate-ping"></span>
          <span className="tracking-wide uppercase font-semibold">Initializing Radar Stream...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-obsidian-ink flex flex-col antialiased bg-grid-dots">
      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 sm:px-10 py-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-mono text-fog hover:text-obsidian-ink transition inline-flex items-center gap-1.5 group">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            <span>Workspaces</span>
          </Link>
        </div>

        {/* 1. Header Block */}
        <div className="mb-8 border-b border-ash pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-5xl sm:text-6xl font-display text-obsidian-ink tracking-tight italic">
                {productName || 'Product Feed'}
              </h1>
              {productUrl && (
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-fog hover:text-obsidian-ink transition underline decoration-ash underline-offset-4"
                >
                  {productUrl.replace('https://', '').replace('http://', '').replace('www.', '')}
                </a>
              )}
            </div>
            <p className="text-fog max-w-lg text-sm leading-relaxed font-sans font-normal">
              Autonomous social listening radar monitoring Reddit, Hacker News, Lobste.rs, Dev.to, and Exa web feeds for active buyer intent.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-obsidian-ink hover:bg-carbon text-white font-medium text-xs px-5 py-2.5 rounded-full transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              {isScanning ? (
                <>
                  <span className="w-2 h-2 bg-emerald-radar rounded-full animate-ping"></span>
                  <span className="font-mono text-xs uppercase tracking-wider">Scanning...</span>
                </>
              ) : (
                <>
                  <span>Trigger Radar Sweep</span>
                  <span className="font-mono text-xs">⟳</span>
                </>
              )}
            </button>
            <Link
              href="/dashboard/settings"
              className="bg-white border border-ash hover:border-obsidian-ink text-obsidian-ink font-medium text-xs px-4 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* 2. LIVE BACKGROUND MONITORING STATUS BAR (Bespoke Radar Card) */}
        <div className="glass-panel rounded-2xl p-5 mb-8 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-5 transition-all">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
              <span className="absolute w-8 h-8 rounded-full bg-emerald-500/20 animate-ping"></span>
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full relative z-10 radar-glow"></span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-obsidian-ink uppercase tracking-wider font-sans">
                  Background Monitoring Stream Active
                </span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full shadow-inner">
                  15m Interval
                </span>
              </div>
              <p className="text-xs text-fog mt-1 font-sans">
                Scanning 9 feeds every 15 minutes • Last auto-sweep: <span className="font-mono font-medium text-obsidian-ink">{lastChecked}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 border-ash/60 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-fog uppercase tracking-wider">Next Auto-Sweep</div>
              <div className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-3 py-0.5 rounded-full mt-0.5 inline-block shadow-xs">
                {formatCountdown(countdown)}
              </div>
            </div>
            <div className="w-px h-8 bg-ash hidden sm:block"></div>
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-fog uppercase tracking-wider">Radar Status</div>
              <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="font-mono uppercase text-[11px] tracking-wider">Listening</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        {scanResult && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-medium mb-6 flex justify-between items-center shadow-xs">
            <span>{scanResult}</span>
            <button onClick={() => setScanResult('')} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Live Radar Sweep Ticker Card */}
        {isScanning && (
          <div className="border border-emerald-500/30 bg-emerald-50/30 backdrop-blur-md rounded-2xl p-5 mb-8 flex items-center gap-4 animate-pulse shadow-sm">
            <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
              <span className="absolute w-8 h-8 rounded-full border border-emerald-500 animate-ping"></span>
              <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full"></span>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">Radar Sweep Executing</div>
              <div className="text-xs font-medium text-obsidian-ink mt-0.5 font-mono">{scanStatus}</div>
            </div>
          </div>
        )}

        {/* 3. Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 bg-white border border-ash/80 p-1.5 rounded-full shadow-xs shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-obsidian-ink text-white shadow-sm font-semibold'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              All Matches ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'hot'
                  ? 'bg-red-600 text-white shadow-sm font-semibold'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              <span>🔥 Hot Intent</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${activeTab === 'hot' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'}`}>
                {hotLeads.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('warm')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'warm'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-fog hover:text-obsidian-ink'
              }`}
            >
              <span>⚡ Warm Leads</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${activeTab === 'warm' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'}`}>
                {warmLeads.length}
              </span>
            </button>
          </div>

          <div className="text-xs font-mono text-fog self-center">
            Showing <span className="font-bold text-obsidian-ink">{filteredLeads.length}</span> verified leads
          </div>
        </div>

        {/* 4. Bespoke Leads Feed List */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white border border-ash/80 rounded-2xl p-14 text-center shadow-xs">
            <div className="relative flex items-center justify-center w-20 h-20 mx-auto mb-4">
              <span className="w-16 h-16 rounded-full border border-ash animate-ping"></span>
              <span className="w-3 h-3 bg-obsidian-ink/30 rounded-full"></span>
            </div>
            <h3 className="text-3xl font-display text-obsidian-ink italic mb-2">No qualified leads in this view</h3>
            <p className="text-fog text-xs max-w-sm mx-auto mb-6 leading-relaxed font-sans">
              The monitoring pipeline is actively checking 9 feeds every 15 minutes. Check back shortly or trigger an immediate sweep.
            </p>
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-obsidian-ink hover:bg-carbon text-white text-xs font-medium px-6 py-3 rounded-full transition shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
            >
              Trigger Radar Sweep ⟳
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead, i) => (
              <div
                key={i}
                className="bg-white border border-ash/90 hover:border-obsidian-ink/30 rounded-2xl p-6 transition-all duration-200 shadow-xs hover:shadow-md relative overflow-hidden group"
              >
                {/* Left score accent strip */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    lead.category === 'hot' ? 'bg-red-500' :
                    lead.category === 'warm' ? 'bg-amber-500' : 'bg-ash'
                  }`}
                ></div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pl-2">
                  <div className="flex-1 space-y-3.5">
                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        lead.category === 'hot' ? 'bg-red-50 border-red-200 text-red-700' :
                        lead.category === 'warm' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-zinc-100 border-zinc-200 text-zinc-600'
                      }`}>
                        {lead.category === 'hot' ? '🔥 Hot Buyer Intent' : lead.category === 'warm' ? '⚡ Warm Lead' : lead.category}
                      </span>
                      
                      <span className="font-mono font-semibold text-obsidian-ink/80 capitalize border border-ash/80 bg-canvas px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-obsidian-ink/40 rounded-full"></span>
                        {lead.source}
                      </span>

                      {lead.author_username && lead.author_username !== 'unknown' && (
                        <span className="font-mono text-[11px] text-fog">by @{lead.author_username}</span>
                      )}
                    </div>

                    {/* Post Text */}
                    <p className="text-obsidian-ink text-[14.5px] leading-relaxed font-sans font-normal text-zinc-900 pr-4">
                      "{lead.text}"
                    </p>

                    {/* AI Intent Intelligence Box */}
                    <div className="bg-canvas-subtle/80 border-l-2 border-iris-pulse/60 p-3.5 rounded-r-xl text-xs text-fog leading-relaxed italic flex items-start gap-2">
                      <div>
                        <span className="font-bold not-italic text-obsidian-ink font-sans mr-1">AI Intent Score Reason:</span>
                        {lead.reasoning}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-5 pt-1 text-xs">
                      {lead.source_url && (
                        <a
                          href={lead.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-obsidian-ink hover:text-iris-pulse transition inline-flex items-center gap-1 group/link"
                        >
                          <span>Open Original Thread</span>
                          <span className="text-[10px] group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform">↗</span>
                        </a>
                      )}

                      <Link
                        href={`/dashboard/leads/${i}`}
                        className="text-fog hover:text-obsidian-ink font-medium transition inline-flex items-center gap-1"
                      >
                        <span>View AI Reply Draft</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Relevance Score Pill Right */}
                  <div className="flex items-center md:flex-col md:items-end justify-between border-t md:border-t-0 border-ash/60 pt-3 md:pt-0 shrink-0">
                    <div className="bg-emerald-50/80 border border-emerald-300/80 text-emerald-700 px-3.5 py-1 rounded-full font-mono font-bold text-sm shadow-xs flex items-center gap-1">
                      <span>{lead.final_score}%</span>
                    </div>
                    <div className="text-fog text-[9px] font-mono font-bold uppercase tracking-wider mt-1.5">Relevance</div>
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


