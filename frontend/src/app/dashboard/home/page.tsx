'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HomeOnboarding() {
  const [url, setUrl] = useState('')
  const [screenshot, setScreenshot] = useState('')
  const [screenshotName, setScreenshotName] = useState('')
  const [isNiche, setIsNiche] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaderMessage, setLoaderMessage] = useState('')
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read URL from query parameters if prefilled from landing page hero box
  useEffect(() => {
    const prefilledUrl = searchParams.get('url')
    if (prefilledUrl) {
      setUrl(prefilledUrl)
    }
  }, [searchParams])

  // Handle uploaded product screenshot conversion to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setScreenshotName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshot(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Analyze URL to build the Product Context
  const handleAnalyzeURL = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    
    const messages = [
      "Scraping landing page elements...",
      "Analyzing layout and screenshots with Llama Vision...",
      "Extracting unique selling propositions (USPs)...",
      "Identifying target customer ICP...",
      "Generating intent-based buyer keywords...",
      "Compiling subreddit channels..."
    ]
    
    let msgIndex = 0
    setLoaderMessage(messages[0])
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length
      setLoaderMessage(messages[msgIndex])
    }, 2000)

    try {
      const response = await fetch('http://localhost:8000/api/products/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, screenshot })
      })

      clearInterval(interval)

      if (!response.ok) {
        throw new Error('Failed to analyze landing page. Please verify that the URL is valid.')
      }

      const data = await response.json()
      
      const previewPayload = {
        url: url,
        name: data.name || '',
        description: data.description || '',
        subreddit_list: data.subreddit_list || ['SaaS', 'startups'],
        keywords: data.keywords || [],
        competitor_names: [],
        icp: {
          ...(data.icp || {}),
          is_niche: isNiche,
          usps: data.icp?.usps || [],
          problem_solved_description: data.icp?.problem_solved_description || '',
          visual_description: data.icp?.visual_description || ''
        }
      }
      
      localStorage.setItem('czero_product_preview', JSON.stringify(previewPayload))
      router.push('/dashboard/settings')
    } catch (err: unknown) {
      clearInterval(interval)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setLoaderMessage('')
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 bg-[#f4f7f5] bg-grid-pattern relative min-h-screen">
      
      {/* Concentric Background Radar Wave Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-[#d4af37]/15 rounded-full -z-10 pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#072720]/10 rounded-full -z-10 pointer-events-none"></div>

      <div className="max-w-xl w-full text-center space-y-8 relative">
        
        {/* Floating Feature Pills (Left & Right Flanking) */}
        <div className="hidden lg:flex absolute -left-44 top-16 bg-white/90 backdrop-blur-md border border-[#072720]/15 px-3.5 py-2.5 rounded-2xl shadow-lg flex-col items-start gap-1 w-40 text-left animate-float-slow">
          <span className="text-[10px] font-mono font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping"></span>
            12 Sources
          </span>
          <span className="text-xs font-bold text-[#072720]">Radar Stream</span>
        </div>

        <div className="hidden lg:flex absolute -right-44 top-20 bg-[#fffdf7]/95 backdrop-blur-md border border-[#d4af37]/60 px-3.5 py-2.5 rounded-2xl shadow-lg flex-col items-start gap-1 w-44 text-left animate-float-reverse">
          <span className="text-[10px] font-mono font-bold text-[#a88720] uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full gold-glow"></span>
            Llama Vision
          </span>
          <span className="text-xs font-bold text-[#072720]">Context Extraction</span>
        </div>

        {/* Header Title with Title Casing & Gold Emphasis */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#fbf7e8] border border-[#d4af37]/60 rounded-full text-[10.5px] font-bold text-[#a88720] uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full gold-glow animate-pulse"></span>
            <span>AI INTENT SCANNER INGESTION</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-display font-extrabold tracking-tight text-[#072720] leading-[1.06]">
            Get Your First <span className="relative inline-block text-[#927218]">10 Paying Users<span className="absolute bottom-1 left-0 right-0 h-3 bg-[#d4af37]/35 -z-10 rounded-sm"></span></span> by Sunday.
          </h1>

          <p className="text-[#547067] text-sm sm:text-base tracking-tight max-w-md mx-auto leading-relaxed font-medium">
            Enter your landing page URL and upload a screenshot to generate deep B2B context, target subreddits, and qualified buyer queries.
          </p>
        </div>

        {/* Form Container with Gold Top Accent Bar */}
        <div className="bg-white border border-[#072720]/15 rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(7,39,32,0.07)] text-left relative overflow-hidden transition-all hover:shadow-[0_16px_50px_rgba(7,39,32,0.1)]">
          
          {/* Top Gold Gradient Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#072720] via-[#d4af37] to-[#072720]"></div>

          {loading ? (
            <div className="py-14 text-center space-y-6">
              {/* Pulsing Scan Loader */}
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
                <span className="absolute w-20 h-20 rounded-full border border-[#10b981]/25 animate-ping"></span>
                <span className="absolute w-14 h-14 rounded-full border border-[#d4af37]/40 animate-pulse"></span>
                <span className="relative w-4 h-4 bg-[#072720] rounded-full radar-glow"></span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#072720]">Analyzing Product Context</h3>
                <p className="text-xs text-[#a88720] font-mono font-bold animate-pulse">{loaderMessage}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAnalyzeURL} className="space-y-6">
              
              {/* URL Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-2">
                  Landing Page URL
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-base">🌐</span>
                  <input
                    type="url"
                    placeholder="https://yourproduct.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] placeholder-[#547067]/50 focus:outline-none transition text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Screenshot Upload with visual label */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
                  Upload UI Screenshot (Vision Ingestion)
                </label>
                <p className="text-[10px] text-[#547067] mb-2 leading-relaxed font-medium">
                  Provide an image of your dashboard layout for deep visual structure and feature mapping.
                </p>
                <div className="relative border-2 border-dashed border-[#072720]/20 hover:border-[#d4af37] rounded-xl p-5 flex items-center justify-center transition bg-[#f8faf8] hover:bg-[#fbf7e8]/30 cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-xs text-center text-[#547067] font-medium flex items-center gap-2">
                    <span className="text-lg group-hover:scale-110 transition-transform">📸</span>
                    {screenshotName ? (
                      <span className="text-[#072720] font-bold">{screenshotName}</span>
                    ) : (
                      <div>
                        <span className="text-[#072720] font-bold block">Select layout screenshot file</span>
                        <span className="text-[10px] text-[#547067]/80">PNG, JPG, or WebP</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Market Scale Focus Segmented Control */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
                  Market Scale Focus
                </label>
                <p className="text-[10px] text-[#547067] mb-2.5 leading-relaxed font-medium">
                  General markets target high volume activity. Niche focus runs deep scans backfilling older signals.
                </p>
                <div className="grid grid-cols-2 gap-2 border border-[#e0ebe6] p-1.5 rounded-xl bg-[#f4f7f5]">
                  <button
                    type="button"
                    onClick={() => setIsNiche(false)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                      !isNiche 
                        ? 'bg-[#072720] text-white shadow-xs' 
                        : 'text-[#547067] hover:text-[#072720]'
                    }`}
                  >
                    General Market (24h Window)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNiche(true)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-lg transition-all duration-200 ${
                      isNiche 
                        ? 'bg-[#072720] text-white shadow-xs' 
                        : 'text-[#547067] hover:text-[#072720]'
                    }`}
                  >
                    Niche Focus (7-day Window)
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 p-3.5 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-[#072720] hover:bg-[#0d3c30] text-white font-bold rounded-full flex items-center justify-center transition shadow-md hover:shadow-lg text-sm group"
              >
                <span>Analyze Landing Page</span>
                <span className="ml-2 text-[#d4af37] group-hover:translate-x-1 transition-transform">→</span>
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}
