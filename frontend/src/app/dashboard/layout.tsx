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
  }, [])

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

  return (
    <div className="min-h-screen bg-canvas text-obsidian-ink flex antialiased">
      {/* 1. Global Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-obsidian-ink/10 bg-white flex flex-col justify-between z-20">
        <div className="p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-2 mb-8 select-none">
            <span className="w-2.5 h-2.5 bg-obsidian-ink rounded-full"></span>
            <span className="text-lg font-bold tracking-tight lowercase">czero</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/dashboard/home"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname === '/dashboard/home'
                  ? 'bg-obsidian-ink text-white font-semibold'
                  : 'text-fog hover:text-obsidian-ink hover:bg-obsidian-ink/5'
              }`}
            >
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname === '/dashboard' || pathname?.startsWith('/dashboard/products/')
                  ? 'bg-obsidian-ink text-white font-semibold'
                  : 'text-fog hover:text-obsidian-ink hover:bg-obsidian-ink/5'
              }`}
            >
              <span>Monitoring</span>
            </Link>
          </nav>
        </div>

        {/* Footer Navigation items */}
        <div className="p-6 border-t border-obsidian-ink/10 space-y-1 bg-white">
          <Link
            href="/dashboard/profile"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === '/dashboard/profile'
                ? 'bg-obsidian-ink text-white font-semibold'
                : 'text-fog hover:text-obsidian-ink hover:bg-obsidian-ink/5'
            }`}
          >
            <span>Profile</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              pathname === '/dashboard/settings'
                ? 'bg-obsidian-ink text-white font-semibold'
                : 'text-fog hover:text-obsidian-ink hover:bg-obsidian-ink/5'
            }`}
          >
            <span>Settings</span>
          </Link>
          <button
            onClick={() => setIsReachUsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-fog hover:text-obsidian-ink hover:bg-obsidian-ink/5 transition text-left"
          >
            <span>Reach Us</span>
          </button>
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen bg-canvas">
        {children}
      </div>

      {/* 3. Floating Modal - Reach Us */}
      {isReachUsOpen && (
        <div className="fixed inset-0 bg-obsidian-ink/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-obsidian-ink/10 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl transform scale-100 transition-all duration-300">
            <h3 className="text-3xl font-display text-obsidian-ink tracking-tight mb-2">
              reach us
            </h3>
            <p className="text-xs text-fog mb-6 leading-relaxed">
              Have questions, feedback, or need help? Send us a message and we'll get back to you.
            </p>

            <form onSubmit={handleSendSupport} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-white border border-obsidian-ink/20 focus:border-obsidian-ink rounded-lg text-obsidian-ink focus:outline-none transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
                  Message
                </label>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  rows={4}
                  placeholder="How can we help you?"
                  className="w-full p-3 bg-white border border-obsidian-ink/20 focus:border-obsidian-ink rounded-lg text-obsidian-ink focus:outline-none transition text-sm resize-none"
                  required
                />
              </div>

              {supportStatus && (
                <div className={`text-xs font-semibold ${supportStatus.includes('failed') ? 'text-red-500' : 'text-emerald-600'}`}>
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
                  className="px-4 py-2 bg-white border border-obsidian-ink text-obsidian-ink hover:bg-obsidian-ink hover:text-white font-medium rounded-full transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingSupport}
                  className="px-5 py-2 bg-obsidian-ink hover:bg-obsidian-ink/90 text-white font-medium rounded-full transition disabled:opacity-50 text-xs"
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
