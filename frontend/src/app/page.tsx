'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [quickUrl, setQuickUrl] = useState('')
  const router = useRouter()

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl) return
    // Redirect to onboarding page with URL prefilled in query param
    router.push(`/dashboard/home?url=${encodeURIComponent(quickUrl)}`)
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col antialiased bg-grid-dots">
      
      {/* 1. Executive Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#f4f7f5]/90 backdrop-blur-md border-b border-[#e0ebe6]">
        <div className="max-w-[1140px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-display font-extrabold text-[#072720] tracking-tight">czero</span>
              <span className="bg-[#fbf7e8] border border-[#d4af37]/50 text-[#a88720] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full gold-glow">
                PRO
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#547067]">
            <a href="#how-it-works" className="hover:text-[#072720] transition">How It Works</a>
            <a href="#features" className="hover:text-[#072720] transition">Product USPs</a>
            <a href="#live-demo" className="hover:text-[#072720] transition">Live Demo</a>
            <a href="#pricing" className="hover:text-[#072720] transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-[#072720] hover:text-[#0d3c30] px-4 py-2 rounded-full transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard/home"
              className="bg-[#072720] hover:bg-[#0d3c30] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition shadow-sm inline-flex items-center gap-1.5"
            >
              <span>Launch Free Scan</span>
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 px-6 max-w-[1140px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#fbf7e8] border border-[#d4af37]/50 rounded-full text-[11px] font-bold text-[#a88720] uppercase tracking-wider mb-6 shadow-xs">
          <span className="w-2 h-2 bg-[#d4af37] rounded-full gold-glow animate-pulse"></span>
          <span>AUTONOMOUS B2B INTENT RADAR • 12 SOCIAL FEEDS MONITORED</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-display tracking-tight text-[#072720] max-w-4xl mx-auto leading-[1.08] mb-6">
          Get your first <span className="text-[#a88720] underline decoration-[#d4af37]/50 underline-offset-8">10 paying users</span> by Sunday.
        </h1>

        <p className="text-[#547067] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
          Paste your SaaS URL. Czero continuously monitors 12 multichannel feeds every 15 minutes, filters out promoter spam, and delivers qualified buyer leads with ready-to-send AI outreach drafts.
        </p>

        {/* Quick URL Scanner Form */}
        <form onSubmit={handleQuickScan} className="max-w-xl mx-auto bg-white border border-[#072720]/20 p-2 rounded-full shadow-[0_8px_30px_rgba(7,39,32,0.08)] flex items-center gap-2 mb-6">
          <input
            type="url"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="https://your-saas-product.com"
            className="flex-1 bg-transparent px-5 py-2.5 text-sm font-medium text-[#072720] placeholder-[#547067]/60 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-[#072720] hover:bg-[#0d3c30] text-white font-semibold text-xs px-6 py-3 rounded-full transition shadow-sm whitespace-nowrap inline-flex items-center gap-1.5"
          >
            <span>Scan My Product</span>
            <span>→</span>
          </button>
        </form>

        <p className="text-xs text-[#547067] font-mono">
          ⚡ Free instant analysis • No credit card required • Scans Reddit, HN, Exa Web, Twitter & LinkedIn
        </p>
      </section>

      {/* 3. Live Product Lead Card Preview Demo */}
      <section id="live-demo" className="py-16 bg-white border-y border-[#e0ebe6]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
              REAL-TIME SIGNAL INTELLIGENCE
            </div>
            <h2 className="text-3xl sm:text-4xl font-display text-[#072720] tracking-tight">
              See How Czero Captures High-Intent Buyers
            </h2>
          </div>

          {/* Sample Sleek Card Mockup */}
          <div className="max-w-3xl mx-auto bg-white border border-[#072720]/20 rounded-2xl p-6 shadow-[0_8px_30px_-6px_rgba(7,39,32,0.08)] relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#d4af37] via-[#c5a059] to-[#072720]"></div>
            
            <div className="pl-2 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-[#fffdf7] border border-[#d4af37]/60 text-[#8c6b12] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    🔥 Hot Intent
                  </span>
                  <span className="bg-[#072720] text-white px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize">
                    r/SaaS
                  </span>
                  <span className="text-xs font-mono text-[#547067]">by @dev_founder_99</span>
                </div>
                <div className="bg-gradient-to-r from-[#fffdf7] to-[#f7eee0] border border-[#d4af37]/60 px-3 py-0.5 rounded-full font-mono text-xs font-bold text-[#927218] flex items-center gap-1 shadow-xs">
                  <span>95%</span>
                  <span className="text-[9px] uppercase tracking-wider">Match</span>
                </div>
              </div>

              <p className="text-[#061d18] text-[15px] leading-relaxed font-semibold">
                "Does anyone know an automated tool to scrape buyer intent keywords across Reddit and Twitter? I'm trying to find early adopters for my B2B SaaS."
              </p>

              <div className="bg-[#f0f6f3] border-l-3 border-l-[#d4af37] px-3.5 py-2.5 rounded-r-xl text-xs text-[#0a3328] font-medium leading-normal flex items-baseline gap-2">
                <span className="font-bold text-[#072720] uppercase tracking-wider text-[10px] shrink-0">
                  AI Intent Reasoning:
                </span>
                <span>
                  The author is explicitly asking for a solution to automate B2B buyer intent tracking, which matches your core product offering 100%.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button className="bg-[#072720] text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-flex items-center gap-1">
                  <span>Open Thread</span>
                  <span className="text-[10px]">↗</span>
                </button>
                <button className="bg-white border border-[#e0ebe6] text-[#072720] text-xs font-semibold px-4 py-1.5 rounded-full inline-flex items-center gap-1">
                  <span>View AI Draft</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Product USPs Grid */}
      <section id="features" className="py-20 px-6 max-w-[1140px] mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
            WHY FOUNDERS CHOOSE CZERO
          </div>
          <h2 className="text-4xl font-display text-[#072720] tracking-tight">
            Built Specifically for B2B Early-Stage Founders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '📡',
              title: '12 Multichannel Feeds',
              desc: 'Monitors Reddit, Hacker News, Lobste.rs, Dev.to, Exa Web (24h), Twitter, LinkedIn, and IndieHackers in parallel.'
            },
            {
              icon: '🛡️',
              title: 'Agency & Spam Pre-Filter',
              desc: 'Automatically filters out agency ads ("SEEKING WORK"), job listings, and resumes to score 0 before calling LLM.'
            },
            {
              icon: '⚡',
              title: '15-Min Background Radar',
              desc: 'Autonomous background scheduling loop sweeps social feeds continuously, saving persistent search state.'
            },
            {
              icon: '🧠',
              title: 'NVIDIA NIM Llama 3.1 8B',
              desc: 'Evaluates commercial buying intent vs builder noise using mini-batched prompts to eliminate hallucinations.'
            },
            {
              icon: '✍️',
              title: '1-Click AI Reply Composer',
              desc: 'Generates non-spammy, empathetic responses tailored to the lead\'s specific complaint or request.'
            },
            {
              icon: '🔍',
              title: 'Vision & Text URL Ingestion',
              desc: 'Just paste your landing page URL. Vision & LLM engines automatically extract your ICP, USPs, and subreddits.'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white border border-[#e0ebe6] p-8 rounded-2xl shadow-xs hover:border-[#072720]/30 transition group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform w-12 h-12 flex items-center justify-center bg-[#ebf2ee] rounded-xl border border-[#d4af37]/30">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-[#072720] mb-2">{item.title}</h3>
              <p className="text-xs text-[#547067] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How It Works Steps */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#e0ebe6] px-6">
        <div className="max-w-[1140px] mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
              SIMPLE 3-STEP PIPELINE
            </div>
            <h2 className="text-4xl font-display text-[#072720] tracking-tight">
              From Product URL to First Paying Customer
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Paste Product URL',
                desc: 'AI Vision & scraper extract your target customer persona, pain points, and buyer-intent queries.'
              },
              {
                step: '02',
                title: 'Radar Monitors 12 Feeds',
                desc: '15-minute background loop searches Reddit, HN, and Exa for posts from people seeking solutions.'
              },
              {
                step: '03',
                title: 'Get Verified Leads + Drafts',
                desc: 'Review high-intent matches (80%+ score) and send personalized, non-salesy AI outreach replies.'
              }
            ].map((step, i) => (
              <div key={i} className="bg-[#f4f7f5] border border-[#e0ebe6] p-8 rounded-2xl relative">
                <div className="text-4xl font-mono font-extrabold text-[#d4af37] mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-bold text-[#072720] mb-2">{step.title}</h3>
                <p className="text-xs text-[#547067] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-[1140px] mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
            TRANSPARENT PRICING
          </div>
          <h2 className="text-4xl font-display text-[#072720] tracking-tight">
            Start Free • Upgrade as You Scale
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              name: 'Free Radar',
              price: '$0',
              desc: 'Perfect for testing intent signals for your project.',
              features: ['5 leads / week', 'Reddit & HN sources', 'AI intent scoring', 'Standard subreddits'],
              popular: false,
              cta: 'Get Started Free',
              link: '/dashboard/home'
            },
            {
              name: 'Founder Pro',
              price: '$29',
              period: '/mo',
              desc: 'Everything you need to acquire your first 10-50 users.',
              features: ['Unlimited leads', 'All 12 Social & Web Feeds', '15-Min Background Radar', 'AI Outreach Draft Composer', 'Exa Semantic Web Sweeps', 'Spam & Agency Pre-Filter'],
              popular: true,
              cta: 'Start Pro Trial',
              link: '/dashboard/home'
            },
            {
              name: 'Growth Agency',
              price: '$79',
              period: '/mo',
              desc: 'For multi-product founders and growth teams.',
              features: ['Up to 5 Workspace URLs', 'Webhook & Slack Alerts', 'Priority LLM Scoring', 'CSV Lead Exports', 'Dedicated Support'],
              popular: false,
              cta: 'Get Agency Access',
              link: '/dashboard/home'
            }
          ].map((plan, i) => (
            <div
              key={i}
              className={`p-8 rounded-2xl border transition flex flex-col justify-between ${
                plan.popular
                  ? 'bg-[#072720] border-[#d4af37] text-white shadow-xl relative'
                  : 'bg-white border-[#e0ebe6] text-[#072720]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#d4af37] text-[#072720] text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full shadow-xs">
                  ★ MOST POPULAR FOR FOUNDERS
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className={`text-xs mb-6 ${plan.popular ? 'text-white/70' : 'text-[#547067]'}`}>{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-extrabold">{plan.price}</span>
                  {plan.period && <span className={`text-xs ${plan.popular ? 'text-white/70' : 'text-[#547067]'}`}>{plan.period}</span>}
                </div>

                <ul className="space-y-3 text-xs mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className={plan.popular ? 'text-[#d4af37]' : 'text-[#10b981]'}>✓</span>
                      <span className={plan.popular ? 'text-white/90' : 'text-[#072720]'}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.link}
                className={`block w-full text-center py-3 rounded-full text-xs font-semibold transition ${
                  plan.popular
                    ? 'bg-[#d4af37] hover:bg-[#b8952b] text-[#072720] font-bold shadow-sm'
                    : 'bg-[#072720] hover:bg-[#0d3c30] text-white shadow-sm'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-12 border-t border-[#e0ebe6] bg-white px-6">
        <div className="max-w-[1140px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#547067]">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[#072720]">czero</span>
            <span>— Intent-Based B2B Lead Generation</span>
          </div>
          <p>© {new Date().getFullYear()} Czero. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
