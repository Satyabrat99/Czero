'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, UploadCloud } from 'lucide-react'

export default function HomeOnboarding() {
  const [url, setUrl] = useState('')
  const [screenshot, setScreenshot] = useState('')
  const [screenshotName, setScreenshotName] = useState('')
  const [isNiche, setIsNiche] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaderMessage, setLoaderMessage] = useState('')
  const [error, setError] = useState('')
  
  const router = useRouter()

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
        competitor_names: [], // Start with empty competitors
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
    <div className="flex-1 flex flex-col justify-center items-center py-6 px-6 sm:px-10 bg-[#f4f7f5] bg-grid-dots">
      <div className="max-w-lg w-full text-center space-y-4">
        
        {/* Restored Editorial Serif Header Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-[#ebf2ee] border border-[#d4af37]/40 rounded-full text-[10px] font-bold text-[#072720] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full gold-glow"></span>
            <span>AI Intent Scanner Ingestion</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-normal tracking-tight text-[#072720] leading-[1.05]">
            get your first 10 users by sunday
          </h1>
          <p className="text-[#547067] text-xs max-w-sm mx-auto font-medium leading-relaxed">
            Enter your landing page URL and optional screenshot to generate B2B context & buyer queries.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#e0ebe6] rounded-2xl p-6 shadow-[0_4px_25px_rgba(7,39,32,0.05)] text-left">
          {loading ? (
            <div className="py-8 text-center space-y-4">
              {/* Pulsing Scan Loader */}
              <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
                <span className="absolute w-16 h-16 rounded-full border border-[#10b981]/20 animate-ping"></span>
                <span className="absolute w-12 h-12 rounded-full border border-[#d4af37]/30 animate-pulse"></span>
                <span className="relative w-3.5 h-3.5 bg-[#072720] rounded-full radar-glow"></span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#072720]">Analyzing Product Context</h3>
                <p className="text-xs text-[#547067] font-mono animate-pulse">{loaderMessage}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAnalyzeURL} className="space-y-4">
              
              {/* URL Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1">
                  Landing Page URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourproduct.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] placeholder-[#547067]/50 focus:outline-none transition text-xs font-medium"
                  required
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1">
                  Upload Screenshot (Vision Ingestion)
                </label>
                <div className="relative border border-dashed border-[#072720]/20 hover:border-[#072720]/50 rounded-xl p-3 flex items-center justify-center transition bg-[#f8faf8] cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-xs text-center text-[#547067] font-medium flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#072720]" />
                    {screenshotName ? (
                      <span className="text-[#072720] font-semibold">{screenshotName}</span>
                    ) : (
                      <span>Select layout image file <span className="text-[9px] text-[#547067]/70 font-mono inline ml-1">(PNG, JPG, WebP)</span></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Niche vs General Toggle */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1">
                  Market Scale Focus
                </label>
                <div className="grid grid-cols-2 gap-2 border border-[#e0ebe6] p-1 rounded-xl bg-[#f4f7f5]">
                  <button
                    type="button"
                    onClick={() => setIsNiche(false)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg transition ${
                      !isNiche 
                        ? 'bg-white text-[#072720] border border-[#e0ebe6] shadow-xs' 
                        : 'text-[#547067] hover:text-[#072720]'
                    }`}
                  >
                    General Market (24h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNiche(true)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg transition ${
                      isNiche 
                        ? 'bg-white text-[#072720] border border-[#e0ebe6] shadow-xs' 
                        : 'text-[#547067] hover:text-[#072720]'
                    }`}
                  >
                    Niche Focus (7-day)
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 p-2.5 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold rounded-full flex items-center justify-center gap-2 transition shadow-sm text-xs group"
              >
                <span>Analyze Landing Page</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#d4af37] group-hover:translate-x-0.5 transition-transform" />
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}

