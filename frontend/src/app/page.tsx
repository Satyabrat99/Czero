'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import JellyfishCursorGlow from '@/components/JellyfishCursorGlow'
import { 
  Globe, 
  Zap, 
  Flame, 
  ArrowRight, 
  Radio, 
  Search, 
  Share2, 
  Rss, 
  MessageSquare, 
  Cpu, 
  Layers, 
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Compass,
  Code,
  FileCode,
  Briefcase
} from 'lucide-react'

export default function Home() {
  const [quickUrl, setQuickUrl] = useState('')
  const router = useRouter()

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl) return
    router.push(`/dashboard/home?url=${encodeURIComponent(quickUrl)}`)
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-[#072720] flex flex-col antialiased bg-grid-dots selection:bg-[#d4af37]/20 selection:text-[#072720] relative overflow-x-hidden">
      
      {/* Interactive Jellyfish Cursor Glow Mesh Background */}
      <JellyfishCursorGlow />
      
      {/* 1. Executive Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#f4f7f5]/90 backdrop-blur-md border-b border-[#e0ebe6] transition-all">
        <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-display font-normal text-[#072720] tracking-tight group-hover:scale-105 transition-transform">czero</span>
              <span className="bg-[#fbf7e8] border border-[#d4af37]/60 text-[#a88720] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full gold-glow">
                PRO
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#547067]">
            <a href="#how-it-works" className="hover:text-[#072720] transition">How It Works</a>
            <a href="#features" className="hover:text-[#072720] transition">Product USPs</a>
            <a href="#live-demo" className="hover:text-[#072720] transition">Live Demo</a>
            <a href="#pricing" className="hover:text-[#072720] transition">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-xs font-bold text-[#072720] hover:text-[#0d3c30] px-4 py-2 rounded-full transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard/home"
              className="bg-[#072720] hover:bg-[#0d3c30] text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-sm hover:shadow-md inline-flex items-center gap-1.5 group"
            >
              <span>Launch Free Scan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Rich Patterns & Floating Widgets */}
      <section className="pt-20 pb-24 px-6 max-w-[1240px] mx-auto text-center relative">
        
        {/* Concentric Radar Wave Ring Pattern Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] border border-[#d4af37]/15 rounded-full -z-10 pointer-events-none animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#072720]/10 rounded-full -z-10 pointer-events-none"></div>

        {/* Floating Signal Widget Left - Positioned high in left margin */}
        <div className="hidden lg:flex absolute left-0 xl:-left-12 2xl:-left-16 top-2 bg-white/95 backdrop-blur-md border border-[#072720]/15 p-3 rounded-2xl shadow-xl animate-float-slow flex-col items-start gap-1 w-44 text-left z-10">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#10b981] uppercase tracking-wider">
            <span className="w-2 h-2 bg-[#10b981] rounded-full animate-ping"></span>
            <span>Live Signal</span>
          </div>
          <p className="text-xs font-bold text-[#072720] line-clamp-1">"Looking for B2B dev tools..."</p>
          <div className="text-[10px] font-mono text-[#a88720] font-bold">r/SaaS • 98% Match</div>
        </div>

        {/* Floating Signal Widget Right - Staggered lower in right margin */}
        <div className="hidden lg:flex absolute right-0 xl:-right-12 2xl:-right-16 top-44 xl:top-48 bg-[#fffdf7]/95 backdrop-blur-md border border-[#d4af37]/60 p-3 rounded-2xl shadow-xl animate-float-reverse flex-col items-start gap-1 w-48 text-left z-10">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#a88720] uppercase tracking-wider">
            <span className="w-2 h-2 bg-[#d4af37] rounded-full gold-glow"></span>
            <span>Verified Lead</span>
          </div>
          <p className="text-xs font-bold text-[#072720] line-clamp-1">"Need automated scraper..."</p>
          <div className="text-[10px] font-mono text-[#10b981] font-bold">Hacker News • 95% Match</div>
        </div>

        {/* Eyebrow Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-[#fbf7e8] border border-[#d4af37]/60 rounded-full text-[11px] font-bold text-[#a88720] uppercase tracking-wider mb-6 shadow-xs">
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute w-3 h-3 bg-[#10b981] rounded-full animate-ping opacity-75"></span>
            <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
          </span>
          <span>AUTONOMOUS B2B INTENT RADAR • 12 FEEDS MONITORED</span>
        </div>

        {/* Balanced & Optimized Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-normal tracking-tight text-[#072720] max-w-3xl mx-auto leading-[1.12] mb-5">
          Get your first <span className="relative inline-block text-[#927218]">10 paying users<span className="absolute bottom-1 left-0 right-0 h-3 bg-[#d4af37]/35 -z-10 rounded-sm"></span></span> by Sunday.
        </h1>

        <p className="text-[#547067] text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8 font-sans font-medium">
          Turn social discussions into qualified buyer leads. Czero monitors 12 channels 24/7, filters out promoter spam, and drafts high-converting AI outreach.
        </p>

        {/* Enhanced Quick URL Scanner Form Box */}
        <form onSubmit={handleQuickScan} className="max-w-xl mx-auto bg-white border-2 border-[#072720]/20 p-2.5 rounded-full shadow-[0_16px_50px_rgba(7,39,32,0.12)] hover:border-[#072720] transition-all flex items-center gap-2 mb-8">
          <div className="pl-4 text-[#d4af37]">
            <Globe className="w-5 h-5" />
          </div>
          <input
            type="url"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="https://your-saas-product.com"
            className="flex-1 bg-transparent px-3 py-2 text-sm font-semibold text-[#072720] placeholder-[#547067]/60 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="bg-[#072720] hover:bg-[#0d3c30] text-white font-bold text-xs px-7 py-3.5 rounded-full transition shadow-md hover:shadow-lg whitespace-nowrap inline-flex items-center gap-2 group"
          >
            <span>Scan My Product</span>
            <ArrowRight className="w-4 h-4 text-[#d4af37] group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="text-xs text-[#547067] font-mono font-semibold flex flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#d4af37]" /> Instant Analysis
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" /> No Credit Card Required
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#072720]" /> Scans Reddit, HN, Exa Web & Twitter
          </span>
        </div>
      </section>

      {/* 3. Multichannel Feeds Monitored Pattern Bar */}
      <section className="py-10 bg-white border-y border-[#e0ebe6] relative">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="text-center text-[10px] font-mono font-bold text-[#547067] uppercase tracking-widest mb-6">
            12 REAL-TIME INTENT SOURCES MONITORED AUTOMATICALLY
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { name: 'Reddit RSS', icon: Radio, color: 'text-red-500' },
              { name: 'Hacker News', icon: Code, color: 'text-amber-500' },
              { name: 'Lobste.rs', icon: Compass, color: 'text-rose-500' },
              { name: 'Dev.to Tech', icon: FileCode, color: 'text-emerald-600' },
              { name: 'Exa Web (24h)', icon: Globe, color: 'text-[#d4af37]' },
              { name: 'Exa Twitter/X', icon: Share2, color: 'text-sky-500' },
              { name: 'Exa LinkedIn', icon: Briefcase, color: 'text-blue-600' },
              { name: 'ProductHunt', icon: Sparkles, color: 'text-orange-500' },
              { name: 'IndieHackers', icon: Zap, color: 'text-emerald-500' },
              { name: 'Quora Q&A', icon: MessageSquare, color: 'text-red-600' }
            ].map((source, i) => {
              const IconComp = source.icon
              return (
                <div
                  key={i}
                  className="bg-[#f4f7f5] border border-[#e0ebe6] hover:border-[#072720]/30 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#072720] flex items-center gap-2 transition hover:-translate-y-0.5 shadow-xs"
                >
                  <IconComp className={`w-3.5 h-3.5 ${source.color}`} />
                  <span>{source.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 4. Live Product Lead Card Preview Demo */}
      <section id="live-demo" className="py-20 px-6">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
              REAL-TIME SIGNAL INTELLIGENCE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-[#072720] tracking-tight">
              See How Czero Captures High-Intent Buyers
            </h2>
          </div>

          {/* 3 Ultra-Clean Minimal Showcase Demo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                source: 'r/SaaS',
                author: 'dev_founder_99',
                score: 98,
                text: 'Does anyone know an automated tool to scrape buyer intent keywords across Reddit and Twitter? Trying to find early adopters for my B2B SaaS.',
                intent: 'Searching for automated B2B buyer intent tracking'
              },
              {
                source: 'Hacker News',
                author: 'tech_lead_alex',
                score: 95,
                text: 'Ask HN: How do you track software intent signals on tech forums without spending 4 hours doing manual searches every day?',
                intent: 'Seeking automated software intent monitoring'
              },
              {
                source: 'Lobste.rs',
                author: 'growth_hacker',
                score: 91,
                text: 'Looking for a lightweight social listening tool specifically built for B2B buyer queries. Any open recommendations?',
                intent: 'Active query requesting B2B social listening'
              }
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#072720]/10 hover:border-[#072720]/30 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Clean Top Meta */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white bg-[#072720] px-2.5 py-0.5 rounded-full text-[10px]">
                        {card.source}
                      </span>
                      <span className="text-xs font-mono text-[#547067]">
                        @{card.author}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-[#8c6b12] bg-[#fbf7e8] border border-[#d4af37]/50 px-2.5 py-0.5 rounded-full">
                      {card.score}% Match
                    </span>
                  </div>

                  {/* Clean Post Text */}
                  <p className="text-[#072720] text-xs sm:text-[13px] leading-relaxed font-medium">
                    &quot;{card.text}&quot;
                  </p>
                </div>

                {/* Bottom 1-Line AI Intent & Link */}
                <div className="pt-3 mt-3 border-t border-[#e0ebe6] space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#547067] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span className="line-clamp-1">{card.intent}</span>
                  </div>

                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#072720] group-hover:text-[#a88720] transition-colors"
                  >
                    <span>View AI Reply Draft</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#d4af37] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Product USPs Grid */}
      <section id="features" className="py-20 px-6 max-w-[1240px] mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
            WHY FOUNDERS CHOOSE CZERO
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-[#072720] tracking-tight">
            Built Specifically for B2B Early-Stage Founders
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Radio,
              title: '12 Multichannel Feeds',
              desc: 'Monitors Reddit, Hacker News, Lobste.rs, Dev.to, Exa Web (24h), Twitter, LinkedIn, and IndieHackers in parallel.'
            },
            {
              icon: ShieldCheck,
              title: 'Agency & Spam Pre-Filter',
              desc: 'Automatically filters out agency ads ("SEEKING WORK"), job listings, and resumes to score 0 before calling LLM.'
            },
            {
              icon: Zap,
              title: '15-Min Background Radar',
              desc: 'Autonomous background scheduling loop sweeps social feeds continuously, saving persistent search state.'
            },
            {
              icon: Cpu,
              title: 'NVIDIA NIM Llama 3.1 8B',
              desc: 'Evaluates commercial buying intent vs builder noise using mini-batched prompts to eliminate hallucinations.'
            },
            {
              icon: Sparkles,
              title: '1-Click AI Reply Composer',
              desc: 'Generates non-spammy, empathetic responses tailored to the lead\'s specific complaint or request.'
            },
            {
              icon: Search,
              title: 'Vision & Text URL Ingestion',
              desc: 'Just paste your landing page URL. Vision & LLM engines automatically extract your ICP, USPs, and subreddits.'
            }
          ].map((item, i) => {
            const ItemIcon = item.icon
            return (
              <div key={i} className="bg-white border border-[#e0ebe6] p-8 rounded-2xl shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-[#072720]/30 transition-all duration-300 group">
                <div className="mb-4 group-hover:scale-110 transition-transform w-12 h-12 flex items-center justify-center bg-[#ebf2ee] rounded-xl border border-[#d4af37]/30 text-[#072720]">
                  <ItemIcon className="w-6 h-6 text-[#072720]" />
                </div>
                <h3 className="text-xl font-display font-normal text-[#072720] mb-2">{item.title}</h3>
                <p className="text-xs text-[#547067] leading-relaxed font-medium">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 6. How It Works Steps */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#e0ebe6] px-6">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
              SIMPLE 3-STEP PIPELINE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-[#072720] tracking-tight">
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
              <div key={i} className="bg-[#f4f7f5] border border-[#e0ebe6] p-8 rounded-2xl hover:-translate-y-1 transition-all duration-300 relative">
                <div className="text-4xl font-mono font-extrabold text-[#d4af37] mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-display font-normal text-[#072720] mb-2">{step.title}</h3>
                <p className="text-xs text-[#547067] leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-[1240px] mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-[#a88720] uppercase tracking-wider mb-2 font-mono">
            TRANSPARENT PRICING
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-normal text-[#072720] tracking-tight">
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
              className={`p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${
                plan.popular
                  ? 'bg-[#072720] border-[#d4af37] text-white shadow-xl relative'
                  : 'bg-white border-[#e0ebe6] text-[#072720] hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#d4af37] text-[#072720] text-[10px] font-mono font-extrabold uppercase px-3 py-1 rounded-full shadow-xs">
                  ★ MOST POPULAR FOR FOUNDERS
                </div>
              )}
              <div>
                <h3 className="text-2xl font-display font-normal mb-1">{plan.name}</h3>
                <p className={`text-xs mb-6 ${plan.popular ? 'text-white/70' : 'text-[#547067]'}`}>{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-normal">{plan.price}</span>
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
                className={`block w-full text-center py-3.5 rounded-full text-xs font-bold transition shadow-sm ${
                  plan.popular
                    ? 'bg-[#d4af37] hover:bg-[#b8952b] text-[#072720] shadow-sm'
                    : 'bg-[#072720] hover:bg-[#0d3c30] text-white shadow-sm'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="py-12 border-t border-[#e0ebe6] bg-white px-6">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#547067]">
          <div className="flex items-center gap-2">
            <span className="font-display font-normal text-[#072720] text-xl">czero</span>
            <span>— Intent-Based B2B Lead Generation Radar</span>
          </div>
          <p>© {new Date().getFullYear()} Czero. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
