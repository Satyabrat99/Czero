'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const [url, setUrl] = useState('')
  const [keywords, setKeywords] = useState('')
  const [competitors, setCompetitors] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const suggestedKeywords = [
    "looking for alternative to",
    "anyone know good",
    "recommend tool for",
    "frustrated with",
    "what do you use for",
    "switching from",
  ]

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not logged in')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:8000/api/products/full-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          name: url.replace('https://', '').replace('http://', ''),
          description: '',
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          competitor_names: competitors.split(',').map(c => c.trim()).filter(c => c),
          subreddit_list: ['SaaS', 'startups', 'Entrepreneur'],
          icp: {}
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze product')
      }

      const data = await response.json()

      localStorage.setItem('czero_leads', JSON.stringify(data.leads || []))
      localStorage.setItem('czero_stats', JSON.stringify(data.stats || {}))
      localStorage.setItem('czero_product', JSON.stringify({ url, keywords, competitors }))

      setSuccess(`Found ${data.stats?.total || 0} leads! Redirecting...`)

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-gray-400 mb-8">Configure what we monitor for you.</p>

      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Product URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-saas.com"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Keywords (comma separated)
            </label>
            <p className="text-gray-500 text-xs mb-2">
              Use buyer-intent phrases, not generic terms. Better keywords = better leads.
            </p>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="looking for alternative to, anyone know good, recommend tool for"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
              required
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestedKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    if (!keywords.includes(kw)) {
                      setKeywords(keywords ? `${keywords}, ${kw}` : kw)
                    }
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-400"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Competitors (comma separated)</label>
            <input
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Pounce, ReplyGain, HuntIQ"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze & Start Monitoring'}
          </button>
        </form>
      </div>
    </div>
  )
}
