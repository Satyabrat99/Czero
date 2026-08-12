'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login') // Default to Sign In
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col justify-center items-center p-6 antialiased bg-grid-dots">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <span className="text-4xl font-display font-extrabold text-[#072720] tracking-tight">czero</span>
          <span className="bg-[#fbf7e8] border border-[#d4af37]/60 text-[#a88720] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full gold-glow">
            PRO
          </span>
        </Link>
        <p className="text-xs font-mono font-semibold text-[#547067] uppercase tracking-wider">
          Autonomous B2B Intent Signal Radar
        </p>
      </div>

      {/* Auth Card Surface */}
      <div className="w-full max-w-md bg-white border border-[#072720]/15 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgba(7,39,32,0.06)] relative overflow-hidden">
        
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#072720] via-[#d4af37] to-[#072720]"></div>

        {/* Tab Switcher: Sign In (Default) vs Sign Up */}
        <div className="flex items-center bg-[#f4f7f5] border border-[#e0ebe6] p-1.5 rounded-full mb-8">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(false) }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
              mode === 'login'
                ? 'bg-[#072720] text-white shadow-sm'
                : 'text-[#547067] hover:text-[#072720]'
            }`}
          >
            Sign In (Default)
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccess(false) }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-[#072720] text-white shadow-sm'
                : 'text-[#547067] hover:text-[#072720]'
            }`}
          >
            Sign Up (New)
          </button>
        </div>

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-extrabold text-[#072720] tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Founder Account'}
          </h1>
          <p className="text-xs text-[#547067] font-medium mt-1">
            {mode === 'login' 
              ? 'Access your active workspace & real-time intent leads feed.' 
              : 'Start capturing high-intent B2B buyers across 12 social feeds.'
            }
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-xs font-semibold mb-6 flex items-start gap-2">
            <span className="font-bold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-[#ebf2ee] border border-[#10b981]/40 text-[#072720] p-4 rounded-xl text-xs font-semibold mb-6 space-y-1">
            <div className="font-bold text-[#10b981]">Account Confirmation Sent!</div>
            <div className="text-[11px] text-[#547067]">
              We sent a verification email to <span className="font-bold text-[#072720]">{email}</span>. Click the link inside to activate your radar.
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720] mb-2">
              Work Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@saascompany.com"
              className="w-full p-3.5 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] placeholder-[#547067]/60 focus:outline-none transition text-sm font-medium"
              required
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#072720]">
                Password
              </label>
              {mode === 'login' && (
                <span className="text-[11px] text-[#547067] hover:text-[#072720] cursor-pointer font-medium">
                  Forgot?
                </span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full p-3.5 bg-[#f8faf8] border border-[#e0ebe6] focus:border-[#072720] rounded-xl text-[#072720] placeholder-[#547067]/60 focus:outline-none transition text-sm font-medium"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold rounded-full disabled:opacity-50 flex items-center justify-center transition shadow-sm text-sm"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                <span className="ml-1.5">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle Text */}
        <div className="mt-8 text-center pt-6 border-t border-[#e0ebe6]">
          {mode === 'login' ? (
            <p className="text-xs text-[#547067]">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-[#072720] hover:underline"
              >
                Sign Up Here
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#547067]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-[#072720] hover:underline"
              >
                Sign In Here
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Trust Tag */}
      <div className="mt-8 text-center">
        <p className="text-[11px] font-mono text-[#547067]">
          🔒 Secure 256-Bit SSL Encrypted Authentication • Czero Inc.
        </p>
      </div>
    </div>
  )
}
