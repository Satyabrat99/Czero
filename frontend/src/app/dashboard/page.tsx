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
      <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex items-center justify-center">
        <div className="animate-pulse font-medium text-[#547067] tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#072720] rounded-full animate-bounce"></span>
          <span>Loading active product workspaces...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col antialiased">
      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-12 py-12">
        
        {/* Header Block */}
        <div className="mb-10 border-b border-[#e0ebe6] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ebf2ee] border border-[#d4af37]/40 rounded-full text-[10px] font-bold text-[#072720] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full gold-glow"></span>
              <span>Monitored Workspaces</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-display tracking-tight text-[#072720] leading-[1.05]">
              workspaces
            </h1>
            <p className="text-[#547067] max-w-xl text-sm sm:text-base tracking-tight leading-relaxed">
              Select an active product workspace to review target buyer keywords, trigger scans, and access AI outreach drafts.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold text-xs px-6 py-3 rounded-full inline-flex items-center gap-2 transition shadow-sm self-start md:self-auto"
          >
            Setup New Monitor <span>→</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border border-[#e0ebe6] rounded-2xl p-12 text-center bg-white shadow-sm">
            <div className="w-12 h-12 bg-[#ebf2ee] border border-[#d4af37]/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
              📡
            </div>
            <h2 className="text-3xl font-display text-[#072720] mb-2">No workspaces active</h2>
            <p className="text-[#547067] mb-8 text-sm max-w-md mx-auto leading-relaxed">
              You haven't set up any product monitoring configurations yet. Scrape your first landing page to initialize Czero.
            </p>
            <Link
              href="/dashboard/settings"
              className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold px-6 py-3 rounded-full text-xs inline-block transition shadow-sm"
            >
              Get Started Free →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-[#e0ebe6] hover:border-[#072720]/30 rounded-2xl p-7 transition flex flex-col justify-between h-[260px] shadow-[0_4px_20px_-4px_rgba(7,39,32,0.04)] relative overflow-hidden group"
              >
                {/* Active monitoring status badge */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-[#ebf2ee] border border-[#10b981]/30 rounded-full text-[10px] font-bold text-[#072720] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full radar-glow animate-pulse"></span>
                  <span>Active Radar</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-display text-[#072720] tracking-tight pr-24 group-hover:text-[#0d3c30] transition">
                    {product.name}
                  </h3>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#547067] hover:text-[#072720] transition block truncate max-w-[75%] font-medium"
                  >
                    {product.url} ↗
                  </a>
                  <p className="text-[13px] text-[#547067] leading-relaxed line-clamp-2 mt-2">
                    {product.description}
                  </p>
                </div>

                <div className="border-t border-[#e0ebe6] pt-4 flex items-center justify-between">
                  {/* Lead Stats Strip */}
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="px-2.5 py-1 bg-[#f4f7f5] rounded-lg border border-[#e0ebe6]">
                      <span className="font-bold text-[#072720]">{product.stats?.total || 0}</span>
                      <span className="text-[#547067] ml-1 font-sans text-[11px]">total</span>
                    </div>
                    <div className="px-2.5 py-1 bg-[#fbf7e8] rounded-lg border border-[#d4af37]/40">
                      <span className="font-bold text-[#a88720]">{product.stats?.hot || 0}</span>
                      <span className="text-[#a88720]/80 ml-1 font-sans text-[11px]">🔥 hot</span>
                    </div>
                    <div className="px-2.5 py-1 bg-[#ebf2ee] rounded-lg border border-[#e0ebe6]">
                      <span className="font-bold text-[#072720]">{product.stats?.warm || 0}</span>
                      <span className="text-[#547067] ml-1 font-sans text-[11px]">warm</span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/products/${product.id}`}
                    onClick={() => {
                      localStorage.setItem('czero_product', JSON.stringify(product))
                    }}
                    className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold text-xs px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition shadow-sm"
                  >
                    View Feed <span>→</span>
                  </Link>
                </div>
              </div>
            ))}

            {/* Ghost card placeholder to create new workspace */}
            <Link
              href="/dashboard/settings"
              className="border border-dashed border-[#072720]/20 hover:border-[#072720]/50 rounded-2xl p-7 transition flex flex-col items-center justify-center text-center h-[260px] bg-white/50 hover:bg-white"
            >
              <div className="w-10 h-10 rounded-full bg-[#ebf2ee] border border-[#d4af37]/40 flex items-center justify-center text-[#072720] font-bold text-lg mb-2">
                +
              </div>
              <span className="text-2xl font-display text-[#072720] mb-1">Add Workspace</span>
              <p className="text-xs text-[#547067] max-w-[220px] leading-relaxed">
                Add another product context to monitor subreddits and search engines.
              </p>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

