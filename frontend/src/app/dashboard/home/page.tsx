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

  // Read prefilled URL query param if user came from Landing Page Hero Scanner
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) {
      setUrl(urlParam)
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
    
    // Cycle ticker messages to show vision / scraping intelligence
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
      
      // Save analyzed product context to localStorage preview key
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
      
      // Redirect directly to Settings Step 2 for editing/approval
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
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 sm:px-12 bg-[#f4f7f5] bg-grid-pattern antialiased">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Header Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#fbf7e8] border border-[#d4af37]/60 rounded-full text-[10px] font-bold text-[#a88720] uppercase tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full gold-glow"></span>
            <span>AI Intent Scanner Ingestion</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-display font-extrabold tracking-tight text-[#072720] leading-[1.05]">
            Get Your First 10 Users by Sunday
          </h1>

          <p className="text-[#547067] text-sm sm:text-base font-sans font-medium max-w-md mx-auto leading-relaxed">
            Enter your landing page URL and upload a screenshot to generate deep B2B context, target subreddits, and qualified buyer queries.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="bg-white border border-[#072720]/15 rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(7,39,32,0.06)] relative overflow-hidden text-left">
          
          {/* Top Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#072720] via-[#d4af37] to-[#072720]"></div>

          {loading ? (
            <div className="py-12 text-center space-y-6">
              {/* Pulsing Scan Loader */}
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
                <span className="absolute w-20 h-20 rounded-full border border-[#10b981]/20 animate-ping"></span>
                <span className="absolute w-14 h-14 rounded-full border border-[#d4af37]/30 animate-pulse"></span>
                <span className="relative w-4 h-4 bg-[#072720] rounded-full radar-glow"></span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#072720]">Analyzing Product Context</h3>
                <p className="text-xs text-[#547067] font-mono animate-pulse">{loaderMessage}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAnalyzeURL} className="space-y-6">
              
              {/* URL Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-2">
                  Landing Page URL
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#547067]">🌐</span>
                  <input
                    type="url"
                    placeholder="https://yourproduct.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-3.5 pl-11 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] focus:bg-white text-[#072720] placeholder-[#547067]/60 focus:outline-none transition-all text-sm font-semibold rounded-xl shadow-xs"
                    required
                  />
                </div>
              </div>

              {/* Screenshot Upload with visual label */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720]">
                    Upload Screenshot (Vision Ingestion)
                  </label>
                  <span className="text-[10px] font-mono font-semibold text-[#a88720] bg-[#fbf7e8] px-2 py-0.5 rounded-md border border-[#d4af37]/40">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-[10px] text-[#547067] mb-2 leading-relaxed font-medium">
                  Provide an image of your UI for deep visual structure and feature mapping.
                </p>
                <div className="relative border-2 border-dashed border-[#072720]/20 hover:border-[#072720]/50 rounded-2xl p-5 flex items-center justify-center transition-all bg-[#f8faf8] hover:bg-[#ebf2ee]/50 cursor-pointer text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xl group-hover:scale-110 transition-transform">📸</div>
                    <div className="text-xs text-[#072720] font-bold">
                      {screenshotName ? (
                        <span className="text-[#072720] font-bold">{screenshotName}</span>
                      ) : (
                        <span>Click or drag layout image file</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#547067]">PNG, JPG, or WebP (Vision AI layout extraction)</p>
                  </div>
                </div>
              </div>

              {/* Niche vs General Toggle */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-2">
                  Market Scale Focus
                </label>
                <p className="text-[10px] text-[#547067] mb-2.5 leading-relaxed font-medium">
                  General markets look for high volume activity. Niche focus runs deep scans backfilling older signals.
                </p>
                <div className="grid grid-cols-2 gap-2 border border-[#e0ebe6] p-1.5 rounded-2xl bg-[#f4f7f5]">
                  <button
                    type="button"
                    onClick={() => setIsNiche(false)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-all ${
                      !isNiche 
                        ? 'bg-white text-[#072720] border border-[#072720]/15 shadow-xs font-bold' 
                        : 'text-[#547067] hover:text-[#072720]'
                    }`}
                  >
                    General Market (24h Window)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNiche(true)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-xl transition-all ${
                      isNiche 
                        ? 'bg-[#fbf7e8] text-[#a88720] border border-[#d4af37]/60 shadow-xs font-extrabold' 
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
                className="w-full py-4 bg-[#072720] hover:bg-[#0d3c30] text-white font-extrabold rounded-full flex items-center justify-center transition shadow-md hover:shadow-lg text-sm group"
              >
                <span>Analyze Landing Page</span>
                <span className="ml-2 text-base text-[#d4af37] group-hover:translate-x-1 transition-transform">→</span>
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}
