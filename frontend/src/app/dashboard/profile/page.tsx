'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setEmail(user.email || '')
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error("Error fetching user details:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear local states
      localStorage.removeItem('czero_product')
      localStorage.removeItem('czero_product_preview')
      localStorage.removeItem('czero_leads')
      localStorage.removeItem('czero_stats')
      
      router.push('/auth/login')
    } catch (err) {
      console.error("Error signing out:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="animate-pulse font-medium text-fog tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-obsidian-ink rounded-full animate-bounce"></span>
          <span>Loading user profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-12 py-12 bg-canvas">
      
      {/* Header Block */}
      <div className="mb-12 border-b border-obsidian-ink/10 pb-8">
        <h1 className="text-5xl sm:text-6xl font-display tracking-tight text-obsidian-ink mb-3 leading-[1.05]">
          profile
        </h1>
        <p className="text-fog max-w-xl text-base tracking-tight leading-relaxed">
          Manage your account credentials, view workspace subscription, or log out of Czero.
        </p>
      </div>

      {/* Account Info Cards */}
      <div className="max-w-xl bg-white border border-obsidian-ink/10 rounded-xl p-8 space-y-8 shadow-sm">
        
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
              Account Email
            </span>
            <div className="text-sm font-semibold text-obsidian-ink select-all">
              {email}
            </div>
          </div>

          <div className="border-t border-obsidian-ink/5 pt-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-obsidian-ink mb-1.5">
              Plan Level
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-obsidian-ink text-white rounded text-[10px] font-bold uppercase tracking-wider">
                Developer Sandbox
              </span>
              <span className="text-xs text-fog">Free Tier</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="border-t border-obsidian-ink/10 pt-6">
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 bg-white border border-obsidian-ink hover:bg-obsidian-ink hover:text-white text-obsidian-ink font-semibold rounded-full transition text-xs shadow-xs"
          >
            Sign Out of Account
          </button>
        </div>

      </div>

    </div>
  )
}
