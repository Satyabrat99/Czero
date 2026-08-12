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
      <div className="flex-1 flex items-center justify-center bg-[#f4f7f5]">
        <div className="animate-pulse font-medium text-[#547067] tracking-tight flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#072720] rounded-full animate-bounce"></span>
          <span>Loading user profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-[1200px] w-full mx-auto px-6 sm:px-12 py-12 bg-[#f4f7f5]">
      
      {/* Header Block */}
      <div className="mb-10 border-b border-[#e0ebe6] pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ebf2ee] border border-[#d4af37]/40 rounded-full text-[10px] font-bold text-[#072720] uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full gold-glow"></span>
          <span>Account Settings</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-display tracking-tight text-[#072720] mb-2 leading-[1.05]">
          profile
        </h1>
        <p className="text-[#547067] max-w-xl text-sm sm:text-base tracking-tight leading-relaxed">
          Manage your account credentials, view workspace subscription, or log out of Czero.
        </p>
      </div>

      {/* Account Info Cards */}
      <div className="max-w-xl bg-white border border-[#e0ebe6] rounded-2xl p-8 space-y-8 shadow-[0_4px_25px_rgba(7,39,32,0.04)]">
        
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
              Account Email
            </span>
            <div className="text-sm font-bold text-[#072720] select-all font-mono">
              {email}
            </div>
          </div>

          <div className="border-t border-[#e0ebe6] pt-4">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#072720] mb-1.5">
              Plan Level
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="px-3 py-1 bg-[#fbf7e8] border border-[#d4af37]/50 text-[#a88720] rounded-full text-[10px] font-bold uppercase tracking-wider">
                PRO RADAR ACCELERATOR
              </span>
              <span className="text-xs text-[#547067] font-medium">Free Developer Sandbox</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="border-t border-[#e0ebe6] pt-6">
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 bg-white border border-[#072720] hover:bg-[#072720] hover:text-white text-[#072720] font-semibold rounded-full transition text-xs shadow-xs"
          >
            Sign Out of Account
          </button>
        </div>

      </div>

    </div>
  )
}

