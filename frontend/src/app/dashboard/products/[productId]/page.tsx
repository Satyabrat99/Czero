'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import RadarVisual from '@/components/RadarVisual'
import { Flame, Zap, RotateCw, ArrowLeft, ExternalLink, ArrowRight, X, Radio } from 'lucide-react'

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
    // Remove unclosed or raw HTML tags
    .replace(/<a\b[^>]*>/gi, ' ')
    .replace(/<\/a>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Unescape hex and decimal HTML entities
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')

  // Strip trailing broken angle brackets or URL parameters in text
  cleaned = cleaned.replace(/<[^>]*$/g, '')
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
      <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex items-center justify-center">
        <div className="font-mono text-xs text-[#547067] flex items-center space-x-3 bg-white px-6 py-4 rounded-full border border-[#e0ebe6] shadow-sm">
          <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-ping"></span>
          <span className="tracking-wide uppercase font-semibold text-[#072720]">Initializing Radar Stream...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col antialiased bg-grid-dots">
      <main className="flex-1 max-w-[1140px] w-full mx-auto px-6 sm:px-10 py-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-mono text-[#547067] hover:text-[#072720] transition inline-flex items-center gap-1.5 group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Workspaces</span>
          </Link>
        </div>

        {/* 1. Header Block */}
        <div className="mb-8 border-b border-[#e0ebe6] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-5xl sm:text-6xl font-display text-[#072720] tracking-tight">
                {productName || 'Product Feed'}
              </h1>
              {productUrl && (
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[#547067] hover:text-[#072720] transition underline decoration-[#e0ebe6] underline-offset-4 inline-flex items-center gap-1"
                >
                  <span>{productUrl.replace('https://', '').replace('http://', '').replace('www.', '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="text-[#547067] max-w-lg text-sm leading-relaxed font-sans">
              Autonomous social listening radar monitoring Reddit, Hacker News, Lobste.rs, Dev.to, and Exa web feeds for active buyer intent.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold text-xs px-6 py-3 rounded-full transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isScanning ? (
                <>
                  <span className="w-2 h-2 bg-[#10b981] rounded-full animate-ping"></span>
                  <span className="font-mono text-xs uppercase tracking-wider">Scanning...</span>
                </>
              ) : (
                <>
                  <span>Trigger Radar Sweep</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </>
              )}
            </button>
            <Link
              href="/dashboard/settings"
              className="bg-white border border-[#e0ebe6] hover:border-[#072720] text-[#072720] font-semibold text-xs px-5 py-3 rounded-full transition shadow-sm"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* 2. LIVE BACKGROUND MONITORING STATUS BAR (Bespoke Half-Dome Sonar Radar Card) */}
        <div className="bg-white border border-[#e0ebe6] rounded-2xl p-5 mb-8 shadow-[0_4px_24px_-4px_rgba(7,39,32,0.05)] flex flex-col sm:flex-row items-center justify-between gap-5 transition-all overflow-hidden relative">
          <div className="flex items-center gap-5">
            {/* 180-Degree Animated Sonar Dome Radar Visual */}
            <div className="shrink-0 -mb-2">
              <RadarVisual size={50} variant="half" status={isScanning ? 'scanning' : 'active'} />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#072720] uppercase tracking-wider font-sans">
                  BACKGROUND RADAR STREAM ACTIVE
                </span>
                <span className="bg-[#fbf7e8] border border-[#d4af37]/50 text-[#a88720] text-[10px] font-mono font-bold px-3 py-0.5 rounded-full shadow-xs">
                  15m Interval
                </span>
              </div>
              <p className="text-xs text-[#547067] mt-1 font-sans font-medium">
                Scanning 9 feeds every 15 minutes • Last auto-sweep: <span className="font-mono font-bold text-[#072720]">{lastChecked}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 border-[#e0ebe6] pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-[#547067] uppercase tracking-wider">NEXT AUTO-SWEEP</div>
              <div className="text-sm font-mono font-extrabold text-[#072720] bg-[#f4f7f5] border border-[#e0ebe6] px-3.5 py-0.5 rounded-full mt-0.5 inline-block shadow-xs">
                {formatCountdown(countdown)}
              </div>
            </div>
            <div className="w-px h-8 bg-[#e0ebe6] hidden sm:block"></div>
            <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-[#547067] uppercase tracking-wider">RADAR STATUS</div>
              <div className="text-xs font-bold text-[#10b981] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
                <span className="font-mono uppercase text-[11px] tracking-wider">LISTENING</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        {scanResult && (
          <div className="bg-[#ebf2ee] border border-[#10b981]/40 text-[#072720] px-5 py-3.5 rounded-2xl text-xs font-semibold mb-6 flex justify-between items-center shadow-xs">
            <span>{scanResult}</span>
            <button onClick={() => setScanResult('')} className="text-[#072720] hover:text-black font-bold ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Radar Sweep Ticker Card */}
        {isScanning && (
          <div className="border border-[#10b981]/40 bg-[#ebf2ee]/80 rounded-2xl p-4 mb-8 flex items-center gap-3.5 shadow-sm">
            <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
              <span className="absolute w-7 h-7 rounded-full bg-[#10b981]/30 animate-ping"></span>
              <span className="w-3 h-3 bg-[#10b981] rounded-full"></span>
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-[#072720] uppercase tracking-wider">Radar Sweep Executing</div>
              <div className="text-xs font-semibold text-[#072720] mt-0.5 font-mono">{scanStatus}</div>
            </div>
          </div>
        )}

        {/* 3. Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white border border-[#e0ebe6] p-1.5 rounded-full shadow-xs shrink-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-200 ${
                activeTab === 'all'
                  ? 'bg-[#072720] text-white shadow-sm font-bold'
                  : 'text-[#547067] hover:text-[#072720] font-medium'
              }`}
            >
              All Matches ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'hot'
                  ? 'bg-[#d4af37] text-[#072720] shadow-sm font-extrabold'
                  : 'text-[#547067] hover:text-[#072720] font-medium'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#072720]" />
              <span>Hot Intent</span>
              <span className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold ${activeTab === 'hot' ? 'bg-[#072720]/15 text-[#072720]' : 'bg-[#fbf7e8] text-[#a88720]'}`}>
                {hotLeads.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('warm')}
              className={`px-4 py-2 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'warm'
                  ? 'bg-[#0e4438] text-white shadow-sm font-bold'
                  : 'text-[#547067] hover:text-[#072720] font-medium'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#10b981]" />
              <span>Warm Leads</span>
              <span className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold ${activeTab === 'warm' ? 'bg-white/20 text-white' : 'bg-[#ebf2ee] text-[#072720]'}`}>
                {warmLeads.length}
              </span>
            </button>
          </div>

          <div className="text-xs font-mono text-[#547067] self-center">
            Showing <span className="font-bold text-[#072720]">{filteredLeads.length}</span> verified leads
          </div>
        </div>

        {/* 4. Bespoke Sleek Compact Leads Feed List */}
        {filteredLeads.length === 0 ? (
          <div className="bg-white border border-[#e0ebe6] rounded-2xl p-12 text-center shadow-xs">
            <div className="relative flex items-center justify-center w-14 h-14 mx-auto mb-3 bg-[#ebf2ee] rounded-2xl border border-[#d4af37]/40">
              <Radio className="w-7 h-7 text-[#d4af37]" />
            </div>
            <h3 className="text-2xl font-display text-[#072720] mb-2">No qualified leads in this view</h3>
            <p className="text-[#547067] text-xs max-w-sm mx-auto mb-5 leading-relaxed font-sans">
              The monitoring pipeline is actively checking 9 feeds every 15 minutes. Check back shortly or trigger an immediate sweep.
            </p>
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="bg-[#072720] hover:bg-[#0d3c30] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span>Trigger Radar Sweep</span>
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLeads.map((lead, i) => (
              <div
                key={i}
                className="bg-white border border-[#072720]/15 hover:border-[#072720]/35 rounded-xl p-4.5 sm:p-5 transition-all duration-200 shadow-[0_2px_10px_-2px_rgba(7,39,32,0.04)] hover:shadow-[0_6px_20px_-2px_rgba(7,39,32,0.08)] relative overflow-hidden group"
              >
                {/* Left score accent strip */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    lead.category === 'hot' ? 'bg-gradient-to-b from-[#d4af37] via-[#c5a059] to-[#072720]' :
                    lead.category === 'warm' ? 'bg-gradient-to-b from-[#10b981] to-[#072720]' : 'bg-[#e0ebe6]'
                  }`}
                ></div>

                <div className="pl-1.5 space-y-2.5">
                  {/* Sleek Top Header Meta Row with Inline Relevance Score */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider border shadow-xs inline-flex items-center gap-1 ${
                        lead.category === 'hot' ? 'bg-[#fffdf7] border-[#d4af37]/60 text-[#8c6b12]' :
                        lead.category === 'warm' ? 'bg-[#ebf2ee] border-[#10b981]/40 text-[#072720]' :
                        'bg-[#f4f7f5] border-[#e0ebe6] text-[#547067]'
                      }`}>
                        {lead.category === 'hot' ? (
                          <>
                            <Flame className="w-3 h-3 text-[#d4af37]" />
                            <span>Hot Intent</span>
                          </>
                        ) : lead.category === 'warm' ? (
                          <>
                            <Zap className="w-3 h-3 text-[#10b981]" />
                            <span>Warm Lead</span>
                          </>
                        ) : (
                          <span>{lead.category}</span>
                        )}
                      </span>
                      
                      <span className="font-mono font-bold text-white capitalize bg-[#072720] border border-[#0d3c30] px-2 py-0.5 rounded-full text-[9.5px] inline-flex items-center gap-1 shadow-xs">
                        <span className="w-1 h-1 bg-[#d4af37] rounded-full"></span>
                        {lead.source}
                      </span>

                      {lead.author_username && lead.author_username !== 'unknown' && (
                        <span className="font-mono text-[11px] font-medium text-[#547067]">by @{lead.author_username}</span>
                      )}
                    </div>

                    {/* Inline Gold Relevance Badge */}
                    <div className="bg-gradient-to-r from-[#fffdf7] to-[#f7eee0] border border-[#d4af37]/60 px-3 py-0.5 rounded-full font-mono text-xs font-bold text-[#927218] flex items-center gap-1 shadow-xs shrink-0">
                      <span>{lead.final_score}%</span>
                      <span className="text-[9px] font-bold uppercase text-[#a88720] tracking-wider">Match</span>
                    </div>
                  </div>

                  {/* Post Text - Compact High-Contrast Typography */}
                  <p className="text-[#061d18] text-[14px] sm:text-[14.5px] leading-[1.5] font-sans font-semibold tracking-tight line-clamp-3">
                    "{lead.text}"
                  </p>

                  {/* AI Intent Reasoning Box - Sleek Inline Banner */}
                  <div className="bg-[#f0f6f3] border-l-3 border-l-[#d4af37] px-3 py-2 rounded-r-lg text-[12px] text-[#0a3328] font-medium leading-normal flex items-baseline gap-2">
                    <span className="font-bold text-[#072720] uppercase tracking-wider text-[10px] shrink-0 font-sans">
                      AI Intent:
                    </span>
                    <span className="text-[#0a3328] line-clamp-2 font-sans">
                      {lead.reasoning}
                    </span>
                  </div>

                  {/* Sleek Compact Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    {lead.source_url && (
                      <a
                        href={lead.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold text-[11px] px-3.5 py-1.5 rounded-full transition shadow-xs inline-flex items-center gap-1.5"
                      >
                        <span>Open Thread</span>
                        <ExternalLink className="w-3 h-3 text-[#d4af37]" />
                      </a>
                    )}

                    <Link
                      href={`/dashboard/leads/${i}`}
                      className="bg-white border border-[#e0ebe6] hover:border-[#072720] text-[#072720] font-semibold text-[11px] px-3.5 py-1.5 rounded-full transition shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>View AI Draft</span>
                      <ArrowRight className="w-3 h-3 text-[#072720]" />
                    </Link>
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




