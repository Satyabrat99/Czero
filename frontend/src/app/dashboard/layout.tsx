'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [email, setEmail] = useState('')
  const [activeProductName, setActiveProductName] = useState('Pounce.so')
  const [isReachUsOpen, setIsReachUsOpen] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [sendingSupport, setSendingSupport] = useState(false)
  const [supportStatus, setSupportStatus] = useState('')
  
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || '')
        }
      } catch (err) {
        console.error("Error loading user context:", err)
      }
    }
    fetchUser()

    // Read active workspace product from localStorage
    try {
      const storedProduct = localStorage.getItem('czero_product')
      if (storedProduct) {
        const parsed = JSON.parse(storedProduct)
        if (parsed.name) setActiveProductName(parsed.name)
      }
    } catch (e) {
      console.error(e)
    }
  }, [pathname])

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supportMessage.trim()) return

    setSendingSupport(true)
    setSupportStatus('')

    try {
      const response = await fetch('http://localhost:8000/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          message: supportMessage
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setSupportStatus('Message sent successfully! We\'ll reach out soon.')
      setSupportMessage('')
      setTimeout(() => {
        setIsReachUsOpen(false)
        setSupportStatus('')
      }, 1500)
    } catch (err) {
      console.error(err)
      setSupportStatus('Failed to send message. Please try again.')
    } finally {
      setSendingSupport(false)
    }
  }

  const getInitials = (userEmail: string) => {
    if (!userEmail) return 'CZ'
    return userEmail.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex antialiased">
      {/* 1. Global Left Sidebar — Shopify Deep Forest Green (#072720) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#072720] border-r border-[#0d3c30] text-white flex flex-col justify-between z-30 shadow-xl">
        <div className="p-5">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 pb-6 border-b border-[#124b3c] select-none">
            <div className="w-8 h-8 rounded-lg bg-[#0e4438] border border-[#d4af37]/40 flex items-center justify-center relative shadow-sm">
              <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-display font-semibold tracking-tight text-white">czero</span>
                <span className="px-1.5 py-0.5 bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[9px] font-bold rounded uppercase tracking-wider">PRO</span>
              </div>
              <p className="text-[10px] text-[#799188] font-medium tracking-wider uppercase">Intent Lead Radar</p>
            </div>
          </div>

          {/* Active Product Workspace Widget */}
          <div className="my-5 p-3 rounded-xl bg-[#0c362d] border border-[#145343] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 bg-[#10b981] rounded-full radar-glow"></span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#99b3ad]">Active Workspace</div>
                <div className="text-xs font-semibold text-white truncate">{activeProductName}</div>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-[10px] font-bold text-[#d4af37] hover:text-white transition px-2 py-1 rounded bg-[#072720] border border-[#d4af37]/30"
            >
              Switch
            </Link>
          </div>

          {/* Navigation Links Grouped */}
          <div className="space-y-6 pt-2">
            
            {/* Group 1: Platform */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#d4af37]/80 px-3 mb-2">
                PLATFORM
              </div>
              <nav className="space-y-1">
                <Link
                  href="/dashboard/home"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    pathname === '/dashboard/home'
                      ? 'bg-[#0e4438] text-white font-semibold border-l-2 border-[#d4af37] shadow-xs'
                      : 'text-[#99b3ad] hover:text-white hover:bg-[#0c362d]'
                  }`}
                >
                  <svg className="w-4 h-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home Scan</span>
                </Link>

                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    pathname === '/dashboard' || pathname?.startsWith('/dashboard/products/')
                      ? 'bg-[#0e4438] text-white font-semibold border-l-2 border-[#d4af37] shadow-xs'
                      : 'text-[#99b3ad] hover:text-white hover:bg-[#0c362d]'
                  }`}
                >
                  <svg className="w-4 h-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Product Feed</span>
                </Link>
              </nav>
            </div>

            {/* Group 2: Settings & Profile */}
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#d4af37]/80 px-3 mb-2">
                CONFIG & ACCOUNT
              </div>
              <nav className="space-y-1">
                <Link
                  href="/dashboard/settings"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    pathname === '/dashboard/settings'
                      ? 'bg-[#0e4438] text-white font-semibold border-l-2 border-[#d4af37] shadow-xs'
                      : 'text-[#99b3ad] hover:text-white hover:bg-[#0c362d]'
                  }`}
                >
                  <svg className="w-4 h-4 text-[#99b3ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Radar Settings</span>
                </Link>

                <Link
                  href="/dashboard/profile"
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                    pathname === '/dashboard/profile'
                      ? 'bg-[#0e4438] text-white font-semibold border-l-2 border-[#d4af37] shadow-xs'
                      : 'text-[#99b3ad] hover:text-white hover:bg-[#0c362d]'
                  }`}
                >
                  <svg className="w-4 h-4 text-[#99b3ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Account Profile</span>
                </Link>

                <button
                  onClick={() => setIsReachUsOpen(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#99b3ad] hover:text-white hover:bg-[#0c362d] transition text-left"
                >
                  <svg className="w-4 h-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Reach Support</span>
                </button>
              </nav>
            </div>

          </div>

        </div>

        {/* User Footer Profile Strip */}
        <div className="p-4 border-t border-[#124b3c] bg-[#051e18] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#d4af37] text-[#072720] font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              {getInitials(email)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate max-w-[130px]">{email || 'founder@czero.ai'}</div>
              <div className="text-[10px] text-[#99b3ad]">Developer Plan</div>
            </div>
          </div>
        </div>

      </aside>

      {/* 2. Main content container */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen bg-[#f4f7f5]">
        {children}
      </div>

      {/* 3. Floating Modal - Reach Support */}
      {isReachUsOpen && (
        <div className="fixed inset-0 bg-[#072720]/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-[#e0ebe6] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transform scale-100 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-3xl font-display text-[#072720] tracking-tight">
                reach support
              </h3>
              <span className="w-2 h-2 bg-[#d4af37] rounded-full gold-glow"></span>
            </div>
            <p className="text-xs text-[#547067] mb-6 leading-relaxed">
              Have feedback, integration questions, or custom intent request? Send us a note directly.
            </p>

            <form onSubmit={handleSendSupport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] focus:outline-none transition text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
                  Message
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  placeholder="How can we help your product growth?"
                  className="w-full p-3 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] focus:outline-none transition text-sm resize-none"
                  required
                />
              </div>

              {supportStatus && (
                <div className={`text-xs font-semibold ${supportStatus.includes('failed') ? 'text-red-600' : 'text-[#10b981]'}`}>
                  {supportStatus}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReachUsOpen(false)
                    setSupportMessage('')
                    setSupportStatus('')
                  }}
                  className="px-5 py-2.5 bg-white border border-[#e0ebe6] text-[#072720] hover:bg-[#ebf2ee] font-semibold rounded-full transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingSupport}
                  className="px-6 py-2.5 bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold rounded-full transition disabled:opacity-50 text-xs shadow-sm"
                >
                  {sendingSupport ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

