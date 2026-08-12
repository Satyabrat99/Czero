'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 sm:px-12 bg-canvas">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Header Title */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-6xl font-display tracking-tight text-obsidian-ink leading-[1.05]">
            get your first 10 users by sunday
          </h1>
          <p className="text-fog text-sm sm:text-base tracking-tight max-w-md mx-auto leading-relaxed">
            Enter your landing page URL and upload a screenshot to generate deep B2B context, target subreddits, and qualified buyer queries.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-obsidian-ink/10 rounded-2xl p-8 shadow-sm text-left">
          {loading ? (
            <div className="py-12 text-center space-y-6">
              {/* Pulsing Scan Loader */}
              <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
                <span className="absolute w-20 h-20 rounded-full border border-iris-pulse/15 animate-ping"></span>
                <span className="absolute w-14 h-14 rounded-full border border-iris-pulse/30 animate-pulse"></span>
                <span className="relative w-4 h-4 bg-iris-pulse rounded-full"></span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-obsidian-ink">Analyzing Product</h3>
                <p className="text-xs text-fog animate-pulse">{loaderMessage}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAnalyzeURL} className="space-y-6">
              
              {/* URL Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
                  Landing Page URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourproduct.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-3.5 bg-white border border-obsidian-ink/20 focus:border-obsidian-ink rounded-lg text-obsidian-ink placeholder-fog/45 focus:outline-none transition text-sm font-medium"
                  required
                />
              </div>

              {/* Screenshot Upload with visual label */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
                  Upload Screenshot (Vision Ingestion)
                </label>
                <p className="text-[10px] text-fog mb-2 leading-relaxed">
                  Provide an image of your UI for deep visual structure and feature mapping.
                </p>
                <div className="relative border border-dashed border-obsidian-ink/20 hover:border-obsidian-ink/40 rounded-lg p-4 flex items-center justify-center transition bg-canvas/20 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-xs text-center text-fog font-medium">
                    {screenshotName ? (
                      <span className="text-obsidian-ink font-semibold">{screenshotName}</span>
                    ) : (
                      <>Select layout image file <span className="text-[10px] text-fog/70 block mt-0.5">PNG, JPG, or WebP</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Niche vs General Toggle */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
                  Market Scale Focus
                </label>
                <p className="text-[10px] text-fog mb-3 leading-relaxed">
                  General markets look for high volume activity. Niche focus runs deep scans backfilling older signals.
                </p>
                <div className="grid grid-cols-2 gap-3 border border-obsidian-ink/10 p-1 rounded-lg bg-canvas/30">
                  <button
                    type="button"
                    onClick={() => setIsNiche(false)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition ${
                      !isNiche 
                        ? 'bg-white text-obsidian-ink border border-obsidian-ink/10 shadow-xs' 
                        : 'text-fog hover:text-obsidian-ink'
                    }`}
                  >
                    General Market (24h Window)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNiche(true)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition ${
                      isNiche 
                        ? 'bg-white text-obsidian-ink border border-obsidian-ink/10 shadow-xs' 
                        : 'text-fog hover:text-obsidian-ink'
                    }`}
                  >
                    Niche Focus (7-day Window)
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 p-3 rounded-lg leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium rounded-full flex items-center justify-center transition shadow-sm text-sm"
              >
                Analyze Landing Page <span className="ml-1.5 font-sans">→</span>
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}
