import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const steps = [
  {
    step: '01',
    icon: 'person',
    title: 'Build Profile',
    desc: 'List the skills you can teach and the skills you want to learn. Set your weekly availability.',
  },
  {
    step: '02',
    icon: 'hub',
    title: 'Get Matched',
    desc: 'Our algorithm scores compatibility using skill overlap, reputation, and availability.',
  },
  {
    step: '03',
    icon: 'lock',
    title: 'Book with Escrow',
    desc: 'Both parties lock a credit deposit. It is returned automatically — no ghosting, no wasted time.',
  },
  {
    step: '04',
    icon: 'school',
    title: 'Learn and Earn',
    desc: 'Meet in the session room. Chat and video built in. Credits transfer automatically when done.',
  },
]

const whyPoints = [
  { label: 'Structured', desc: 'Every session is scheduled, tracked, and confirmed by both parties.' },
  { label: 'Accountable', desc: 'Credit escrow means ghosting has a real cost. Your reputation follows you.' },
  { label: 'Fair', desc: 'Advanced skills earn more credits. Basic skills cost less. The economy is balanced.' },
  { label: 'Free', desc: 'No subscriptions, no payment, no Paystack. Just your time and expertise.' },
]

const categories = [
  { icon: 'school', title: 'Academic', desc: 'Python, Data Analysis, Statistics, Web Dev, Machine Learning' },
  { icon: 'palette', title: 'Creative', desc: 'Graphic Design, Video Editing, UI/UX, Music Production, Animation' },
  { icon: 'lightbulb', title: 'Practical Life', desc: 'Public Speaking, Entrepreneurship, Financial Literacy, Languages' },
  { icon: 'auto_awesome', title: 'AI-Evaluated', desc: 'Optional AI scoring of teaching quality across 5 dimensions' },
]

const tiers = [
  { tier: 'Basic', credits: '1 credit / hour', examples: 'Microsoft Office, Study Skills, Cooking' },
  { tier: 'Intermediate', credits: '2 credits / hour', examples: 'Python, Graphic Design, Public Speaking' },
  { tier: 'Advanced', credits: '3 credits / hour', examples: 'Machine Learning, Brand Design, Negotiation' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* Nav */}
      <nav className="glass-header sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">swap_horiz</span>
            </div>
            <span className="text-lg font-bold text-[#0b1c30] font-['Geist']">SkillSwap</span>
          </div>

          <div className="hidden sm:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[#464555] hover:text-[#0b1c30] font-medium transition-colors">
              How it Works
            </a>
            <a href="#categories" className="text-sm text-[#464555] hover:text-[#0b1c30] font-medium transition-colors">
              Browse Skills
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-[#464555] hover:text-[#0b1c30] font-medium px-3 py-2 rounded-lg hover:bg-[#eff4ff] transition-colors font-['Geist']">
              Log In
            </Link>
            <Link href="/register"
              className="text-sm bg-[#4f46e5] text-white font-semibold font-['Geist'] px-4 py-2 rounded-lg hover:bg-[#3525cd] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e5eeff] border border-[#c7c4d8] text-xs font-medium text-[#3525cd] mb-8">
              <span className="material-symbols-outlined text-sm">verified</span>
              Academic Trust · Community Vitality
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0b1c30] leading-tight font-['Geist']">
              Exchange Skills.<br />
              Earn Credits.<br />
              Build Reputation.
            </h1>

            <p className="mt-6 text-lg text-[#464555] leading-relaxed max-w-lg">
              SkillSwap is a peer-to-peer skill exchange platform for university students.
              Trade skills using time credits — earn by teaching, spend by learning.
              Completely free, fully accountable.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register"
                className="px-8 py-3.5 bg-[#4f46e5] text-white font-semibold font-['Geist'] rounded-xl hover:bg-[#3525cd] transition-colors text-sm shadow-lg shadow-[#4f46e5]/25 flex items-center justify-center gap-2">
                Start exchanging skills
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link href="/login"
                className="px-8 py-3.5 bg-white text-[#0b1c30] font-semibold font-['Geist'] rounded-xl border border-[#c7c4d8] hover:bg-[#eff4ff] transition-colors text-sm">
                Sign in to your account
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {['A', 'E', 'C', 'T'].map((l, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold">
                    {l}
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-white bg-[#e5eeff] flex items-center justify-center text-[#4f46e5] text-xs font-bold">
                  +16
                </div>
              </div>
              <p className="text-sm text-[#464555] font-['Geist'] font-medium">
                20+ OAU students already swapping
              </p>
            </div>
          </div>

          {/* Floating glass cards */}
          <div className="relative h-80 hidden lg:block">
            <div className="glass-card absolute top-4 left-8 p-5 rounded-2xl w-56 animate-float"
              style={{ animationDelay: '0s' }}>
              <div className="bg-[#4f46e5]/20 p-2 rounded-lg inline-block mb-3">
                <span className="material-symbols-outlined text-[#4f46e5] text-lg">code</span>
              </div>
              <div className="text-sm font-semibold text-[#0b1c30] font-['Geist']">Python Mastery</div>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="material-symbols-outlined text-[#006e4b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-xs text-[#464555]">Intermediate · 2 cr/hr</span>
              </div>
            </div>

            <div className="glass-card absolute bottom-8 right-4 p-5 rounded-2xl w-60 animate-float"
              style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#464555] uppercase tracking-wider font-['Geist'] font-medium">Credit Wallet</span>
                <span className="material-symbols-outlined text-[#4f46e5] text-lg">account_balance_wallet</span>
              </div>
              <div className="text-3xl font-bold text-[#4f46e5] font-['Geist']">24</div>
              <div className="text-xs text-[#006e4b] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                +5 this week
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg">
          {[
            { value: '33+', label: 'Skills available' },
            { value: '₦0', label: 'Cost to join' },
            { value: '5', label: 'Starter credits' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-[#4f46e5] font-['Geist']">{stat.value}</div>
              <div className="text-xs text-[#464555] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="bg-white py-20 border-y border-[#e5eeff]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist']">How SkillSwap works</h2>
            <p className="mt-3 text-[#464555] max-w-xl mx-auto">
              A structured system that makes peer learning fair, accountable, and easy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => (
              <div key={item.step} className="bg-[#f8f9ff] rounded-2xl p-6 border border-[#e5eeff]">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-[#e5eeff] rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#4f46e5] text-xl">{item.icon}</span>
                  </div>
                  <span className="text-2xl font-bold text-[#c7c4d8] font-['Geist']">{item.step}</span>
                </div>
                <h3 className="font-semibold text-[#0b1c30] mb-2 font-['Geist']">{item.title}</h3>
                <p className="text-sm text-[#464555] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not WhatsApp */}
      <section id="categories" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist']">
                Why not just use WhatsApp?
              </h2>
              <p className="mt-4 text-[#464555] leading-relaxed">
                WhatsApp groups are unstructured, unaccountable, and unfair.
                Someone teaches you for an hour and you ghost them. No consequence.
                SkillSwap changes that.
              </p>
              <ul className="mt-8 space-y-4">
                {whyPoints.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#67f4b7]/40 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                      <span className="material-symbols-outlined text-[#006e4b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#0b1c30] font-['Geist']">{item.label} — </span>
                      <span className="text-[#464555] text-sm">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((card) => (
                <div key={card.title} className="rounded-2xl border border-[#e5eeff] bg-white p-5 card-shadow">
                  <div className="w-10 h-10 bg-[#eff4ff] rounded-xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[#4f46e5] text-lg">{card.icon}</span>
                  </div>
                  <h3 className="font-semibold text-[#0b1c30] text-sm mb-1 font-['Geist']">{card.title}</h3>
                  <p className="text-xs text-[#464555] leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Credit system */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 50%, #6b38d4 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white font-['Geist']">The time-credit economy</h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            Credits represent teaching time. Earn by teaching, spend by learning.
            No money ever changes hands.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {tiers.map((tier) => (
              <div key={tier.tier} className="glass-card rounded-2xl p-6 text-left" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white bg-white/20 mb-4 font-['Geist']">
                  {tier.tier}
                </div>
                <div className="text-2xl font-bold text-white mb-1 font-['Geist']">{tier.credits}</div>
                <p className="text-xs text-white/80 leading-relaxed">{tier.examples}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-white/80 text-sm">
            Every new student gets <strong className="text-white">5 free starter credits</strong> on joining.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-[#0b1c30] font-['Geist']">
            Ready to start swapping skills?
          </h2>
          <p className="mt-4 text-[#464555]">
            Join OAU students already exchanging knowledge on SkillSwap.
            It takes 2 minutes to set up your profile.
          </p>
          <Link href="/register"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 bg-[#4f46e5] text-white font-semibold font-['Geist'] rounded-xl hover:bg-[#3525cd] transition-colors shadow-lg shadow-[#4f46e5]/25">
            Create your free account
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5eeff] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#464555]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4f46e5] rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">swap_horiz</span>
            </div>
            <span className="font-medium text-[#0b1c30] font-['Geist']">SkillSwap</span>
          </div>
          <p>Final year project · Fadare Tolulope Timothy · CSC/2019/137 · OAU Ile-Ife</p>
          <p>Supervised by Prof. Awoyelu</p>
        </div>
      </footer>
    </div>
  )
}
