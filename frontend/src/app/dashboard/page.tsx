'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface ProductStats {
  total: number
  hot: number
  warm: number
}

interface Product {
  id: string
  url: string
  name: string
  description: string
  keywords: string[]
  competitor_names: string[]
  subreddit_list: string[]
  icp: Record<string, any>
  stats?: ProductStats
}

export default function WorkspacesDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const fetchUserAndProducts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          setLoading(false)
          return
        }

        setUserId(user.id)
        const response = await fetch(`http://localhost:8000/api/products?user_id=${user.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces')
        }

        const data = await response.json()
        setProducts(data.products || [])
      } catch (err) {
        console.error("Error loading workspaces:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProducts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-obsidian-ink flex items-center justify-center">
        <div className="animate-pulse font-medium text-fog tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-obsidian-ink rounded-full animate-bounce"></span>
          <span>Loading workspaces...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-obsidian-ink flex flex-col antialiased">
      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-12 py-12">
        
        {/* Header Block */}
        <div className="mb-12 border-b border-obsidian-ink/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-5xl sm:text-6xl font-display tracking-tight text-obsidian-ink mb-3 leading-[1.05]">
              Workspaces
            </h1>
            <p className="text-fog max-w-xl text-base tracking-tight leading-relaxed">
              Select an active product workspace to review target buyer keywords, trigger scans, and access AI outreach drafts.
            </p>
          </div>
          <Link href="/dashboard/settings" className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium text-sm px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition self-start md:self-auto shadow-sm">
            Setup New Monitor <span className="text-xs">→</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border border-obsidian-ink/10 rounded-xl p-12 text-center bg-halftone-dots bg-opacity-5">
            <h2 className="text-3xl font-display text-obsidian-ink mb-3">No workspaces active</h2>
            <p className="text-fog mb-8 text-sm max-w-md mx-auto leading-relaxed">
              You haven't set up any product monitoring configurations yet. Scrape your first landing page to initialize Czero.
            </p>
            <Link
              href="/dashboard/settings"
              className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium px-6 py-3 rounded-full text-sm inline-block transition"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-obsidian-ink/10 rounded-xl p-6 transition hover:border-obsidian-ink/20 flex flex-col justify-between h-[250px] shadow-sm relative overflow-hidden"
              >
                {/* Active monitoring status badge */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-obsidian-ink/5 rounded-full text-[10px] font-bold text-obsidian-ink uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Monitoring</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display text-obsidian-ink tracking-tight pr-24">
                    {product.name}
                  </h3>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-fog hover:text-obsidian-ink transition block truncate max-w-[70%]"
                  >
                    {product.url}
                  </a>
                  <p className="text-[13px] text-fog leading-relaxed line-clamp-2 mt-2">
                    {product.description}
                  </p>
                </div>

                <div className="border-t border-obsidian-ink/5 pt-4 flex items-center justify-between">
                  {/* Lead Stats Strip */}
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="font-bold text-obsidian-ink">{product.stats?.total || 0}</span>
                      <span className="text-fog ml-1">total</span>
                    </div>
                    <div>
                      <span className="font-bold text-red-500">{product.stats?.hot || 0}</span>
                      <span className="text-fog ml-1">hot</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-500">{product.stats?.warm || 0}</span>
                      <span className="text-fog ml-1">warm</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/products/${product.id}`}
                    onClick={() => {
                      // Save selected product context as active session in localStorage
                      localStorage.setItem('czero_product', JSON.stringify(product))
                    }}
                    className="bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium text-xs px-4 py-2 rounded-full inline-flex items-center gap-1 transition"
                  >
                    View Feed <span className="font-sans">→</span>
                  </Link>
                </div>
              </div>
            ))}

            {/* Ghost card placeholder to create new workspace */}
            <Link
              href="/dashboard/settings"
              className="border border-dashed border-obsidian-ink/20 hover:border-obsidian-ink/40 rounded-xl p-6 transition flex flex-col items-center justify-center text-center h-[250px] bg-canvas/30"
            >
              <span className="text-3xl font-display text-obsidian-ink mb-1">+ Workspace</span>
              <p className="text-xs text-fog max-w-[200px] leading-relaxed">
                Add another product context to monitor subreddits and search engines.
              </p>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
