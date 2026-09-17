import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarketingNav from '@/components/marketing/MarketingNav'
import FeatureCard from '@/components/marketing/FeatureCard'
import TestimonialCard from '@/components/marketing/TestimonialCard'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'w-6 h-6',
}

const icons = {
  person: (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  hub: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M10 10.5L6.5 6.5M14 10.5l3.5-4M10 13.5l-3.5 4M14 13.5l3.5 4" />
    </svg>
  ),
  swap: (
    <svg {...iconProps}>
      <path d="M4 8h14M14 4l4 4-4 4" />
      <path d="M20 16H6M10 20l-4-4 4-4" />
    </svg>
  ),
  clockCoin: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  shieldLock: (
    <svg {...iconProps}>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
      <rect x="9.5" y="12" width="5" height="4" rx="1" />
      <path d="M10.5 12v-1.5a1.5 1.5 0 0 1 3 0V12" />
    </svg>
  ),
  verifiedBadge: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  ),
  brainSparkle: (
    <svg {...iconProps}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  ),
  videoCamera: (
    <svg {...iconProps}>
      <rect x="3" y="7" width="12" height="10" rx="2" />
      <path d="M15 10.5l6-3v9l-6-3z" />
    </svg>
  ),
  starTrophy: (
    <svg {...iconProps}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H5a2 2 0 0 0 3 3M16 5h3a2 2 0 0 1-3 3" />
      <path d="M12 12v4" />
      <rect x="9" y="16" width="6" height="2.5" rx="1" />
    </svg>
  ),
}

const steps = [
  {
    number: '1',
    icon: icons.person,
    title: 'Create Your Profile',
    copy: 'Sign up with your OAU email. List the skills you can teach and the ones you want to learn. Submit your certificates and LinkedIn for admin verification.',
  },
  {
    number: '2',
    icon: icons.hub,
    title: 'Get Matched',
    copy: 'Our matching algorithm scores every candidate by skill compatibility, reputation, availability, and session history. You see ranked matches with percentage compatibility scores.',
  },
  {
    number: '3',
    icon: icons.swap,
    title: 'Swap and Grow',
    copy: 'Book a session. Both parties lock a small credit deposit (returned on completion). Teach over our integrated video call and chat. Submit a review. Earn credits. Build your reputation.',
  },
]

const features = [
  {
    icon: icons.clockCoin,
    title: 'Time Credit Economy',
    copy: '1 hour of teaching = 1–3 credits depending on skill complexity. No money changes hands — ever. Credits circulate entirely within the student community.',
    tag: 'Fair · Transparent',
  },
  {
    icon: icons.shieldLock,
    title: 'Escrow Commitment System',
    copy: 'Both parties deposit credits before every session. Credits return automatically on completion. Ghosting costs the offender their deposit and harms their reputation.',
    tag: 'Zero Ghosting',
  },
  {
    icon: icons.verifiedBadge,
    title: 'Admin-Verified Profiles',
    copy: 'Upload your certificates, LinkedIn, GitHub, or portfolio. The Super Admin reviews and scores your skills — Beginner, Intermediate, or Expert — before you go live.',
    tag: 'Trust Built In',
  },
  {
    icon: icons.brainSparkle,
    title: 'AI Teaching Evaluation',
    copy: 'Optional: consent to AI evaluation after your session. GPT-4o-mini analyses your teaching transcript across 5 dimensions and gives you structured feedback to improve.',
    tag: 'AI-Powered',
  },
  {
    icon: icons.videoCamera,
    title: 'Integrated Video and Chat',
    copy: 'Live sessions happen inside SkillSwap — no Zoom, no WhatsApp. Real-time chat, WebRTC video call with TURN relay, file sharing, and a camera test before you start.',
    tag: 'All In One Place',
  },
  {
    icon: icons.starTrophy,
    title: 'Reputation Engine',
    copy: 'Your reputation score combines peer ratings (70%) and AI scores (30%). Top performers earn a Trusted Badge. Your verified proficiency level and no-show count are always visible.',
    tag: 'Earn Your Status',
  },
]

const skillRows = [
  ['Python', 'Data Analysis', 'Graphic Design'],
  ['Public Speaking', 'French Language', 'UI/UX'],
  ['Mathematics', 'Video Editing', 'CV Writing'],
  ['React Development', 'Photography', 'Excel'],
]

const comparisonRows = [
  { without: 'No commitment — anyone can ghost', withUs: 'Credit escrow enforces attendance' },
  { without: 'Self-reported skills — no verification', withUs: 'Admin-verified with proficiency scores' },
  { without: 'No quality measurement', withUs: 'Peer reviews + AI transcript evaluation' },
  { without: 'Arrangements fall apart', withUs: 'Structured session with in-platform video' },
  { without: 'No accountability', withUs: 'Reputation score, no-show record, Trusted Badge' },
  { without: 'Paid platforms cost money', withUs: 'Free — time credits only' },
]

const testimonials = [
  {
    quote:
      'I taught Python to three people and learned Graphic Design in return. The escrow system meant everyone showed up — no ghosting at all.',
    name: 'Adebayo T.',
    course: '400 Level, Computer Science',
  },
  {
    quote:
      "Having the Admin verify my skills and give me an 'Expert' badge for Data Analysis made people trust me immediately. Got matched within a day of joining.",
    name: 'Ngozi A.',
    course: '300 Level, Statistics',
  },
  {
    quote:
      "The video call is built right into the platform. No WhatsApp, no Zoom, no 'my internet cut' excuses. The session just works.",
    name: 'Musa K.',
    course: '500 Level, Electrical Engineering',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* SECTION 2 — HERO */}
      <section className="bg-[#F5F3FF]">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-[#4F46E5] text-xs font-semibold border border-indigo-100">
                OAU Campus · No Money Required
              </span>

              <h1 className="mt-6 text-[38px] leading-[1.1] lg:text-[56px] font-extrabold text-[#0F1729] font-['Geist']">
                Exchange Skills.
                <br />
                Earn Credits.
                <br />
                Build Reputation.
              </h1>

              <p className="mt-6 text-[18px] text-[#64748B] leading-relaxed max-w-lg">
                Teach what you know. Learn what you need. SkillSwap connects OAU students in
                structured, accountable skill sessions — powered by time credits, not money.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="px-8 py-3.5 bg-[#4F46E5] text-white font-semibold rounded-xl hover:bg-[#3f38c4] transition-colors text-sm text-center"
                >
                  Start Swapping →
                </Link>
                <Link
                  href="/match"
                  className="px-8 py-3.5 bg-transparent text-[#0F1729] font-semibold rounded-xl border border-slate-300 hover:bg-white transition-colors text-sm text-center"
                >
                  Browse Skills
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {['A', 'C', 'M'].map((letter) => (
                    <div
                      key={letter}
                      className="w-9 h-9 rounded-full border-2 border-[#F5F3FF] bg-[#4F46E5] flex items-center justify-center text-white text-xs font-bold"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#64748B] font-medium">
                  Join 200+ students already swapping on campus
                </p>
              </div>
            </div>

            {/* Floating card mockup */}
            <div className="relative hidden md:block h-[420px]">
              <div className="absolute top-0 right-0 w-64 bg-white rounded-2xl shadow-lg p-4">
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold">
                  98% Match
                </span>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <span className="text-sm font-semibold text-[#0F1729]">Amaka O.</span>
                </div>
                <p className="mt-3 text-xs text-[#64748B]">
                  Teaching: <span className="text-[#0F1729] font-medium">Python Development</span>
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Wants to learn: <span className="text-[#0F1729] font-medium">Graphic Design</span>
                </p>
                <button className="mt-3 w-full py-2 rounded-lg bg-[#4F46E5] text-white text-xs font-semibold">
                  Request Session
                </button>
              </div>

              <div className="absolute top-40 left-2 w-60 bg-white rounded-2xl shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006E4B]" />
                  <span className="text-sm font-semibold text-[#0F1729]">Session Active</span>
                </div>
                <p className="mt-3 text-xs text-[#64748B]">Escrow: 2 credits locked</p>
                <p className="mt-2 text-xs text-[#64748B]">Chat &nbsp;•&nbsp; Video &nbsp;•&nbsp; Confirm</p>
              </div>

              <div className="absolute bottom-0 right-8 w-52 bg-white rounded-2xl shadow-lg p-4">
                <p className="text-xs text-[#64748B]">Credit balance</p>
                <p className="mt-1 text-3xl font-bold text-[#4F46E5] font-['Geist']">14 cr</p>
                <p className="mt-1 text-xs text-[#006E4B] font-medium">Earned today: +2</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0F1729] font-['Geist']">How SkillSwap Works</h2>
            <p className="mt-3 text-[#64748B]">Three steps from zero to skill exchange</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number} className="text-center md:text-left">
                <div className="inline-flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#4F46E5] text-white text-sm font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                  <span className="text-[#4F46E5]">{step.icon}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0F1729] font-['Geist']">{step.title}</h3>
                <p className="mt-2 text-sm text-[#64748B] leading-relaxed">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — KEY FEATURES */}
      <section id="features" className="bg-[#F8F9FF] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-[#0F1729] font-['Geist']">
            Everything You Need to Learn and Teach
          </h2>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.copy}
                tag={feature.tag}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT IS A SKILL? */}
      <section id="for-students" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold text-[#0F1729] font-['Geist']">
              What counts as a skill on SkillSwap?
            </h2>
            <p className="mt-4 text-[#64748B] leading-relaxed max-w-md">
              A skill is any practical ability you can teach another student — whether you
              learned it in class, through personal projects, online courses, or real-world
              experience. If you can teach it to someone else, it counts.
            </p>
          </div>

          <div>
            <div className="space-y-3">
              {skillRows.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  {row.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 rounded-full border border-indigo-200 bg-[#F5F3FF] text-[#4F46E5] text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-[#64748B]">
              Academic · Technical · Creative · Soft Skills · Languages · Professional
              Development — all welcome.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TRUST AND ACCOUNTABILITY */}
      <section className="bg-[#F5F3FF] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-[#0F1729] font-['Geist']">
            Why SkillSwap is Different from WhatsApp Groups
          </h2>

          <div className="mt-12 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="px-5 py-3 bg-red-50 border-b border-slate-200 text-sm font-semibold text-[#0F1729]">
                Without SkillSwap
              </div>
              <div className="px-5 py-3 bg-emerald-50 border-b border-slate-200 text-sm font-semibold text-[#0F1729]">
                With SkillSwap
              </div>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.without} className="grid grid-cols-2 border-b border-slate-200 last:border-b-0">
                <div className="px-5 py-4 bg-red-50/50 text-sm text-[#0F1729] flex items-start gap-2">
                  <span className="text-red-500">✕</span>
                  <span>{row.without}</span>
                </div>
                <div className="px-5 py-4 bg-emerald-50/50 text-sm text-[#0F1729] flex items-start gap-2">
                  <span className="text-[#006E4B]">✓</span>
                  <span>{row.withUs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — LIVE ACTIVITY FEED */}
      <section className="bg-[#0F1729] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-white font-['Geist']">
            Happening Now on Campus
          </h2>
          <p className="mt-3 text-center text-slate-400">Real student exchanges happening every day</p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <span className="w-10 h-10 rounded-full bg-[#6B38D4] flex items-center justify-center text-white text-sm font-bold shrink-0">
                E
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  Emeka N. is teaching Python Development to Fatima A.
                </p>
                <p className="text-xs text-slate-400 mt-0.5">1 session active</p>
              </div>
              <span className="shrink-0 px-3 py-1 rounded-full bg-white/10 text-xs text-slate-200">
                2 cr locked
              </span>
            </div>

            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <span className="w-10 h-10 rounded-full bg-[#006E4B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                C
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">Chisom O. completed a swap with Tolu F.</p>
                <p className="text-xs text-slate-400 mt-0.5">Graphic Design</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-slate-400">Review submitted</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4">
              <span className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-bold shrink-0">
                Y
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">New verified teacher joined: Yusuf B.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Intermediate Excel · Advanced Data Analysis
                </p>
              </div>
              <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                ✓ Admin Verified
              </span>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-[#4F46E5] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-white text-sm sm:text-base text-center sm:text-left">
              Ready to swap? Your first session deposit is returned on completion. Zero risk.
            </p>
            <Link
              href="/register"
              className="shrink-0 px-6 py-3 bg-white text-[#4F46E5] font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm whitespace-nowrap"
            >
              Create Your Profile →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 8 — SOCIAL PROOF / TESTIMONIALS */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-3xl font-bold text-[#0F1729] font-['Geist']">
            What Students Say
          </h2>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard key={t.name} quote={t.quote} name={t.name} course={t.course} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — FINAL CTA */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6B38D4 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-[40px] leading-tight font-bold text-white font-['Geist']">
            Join the Skill Economy at OAU
          </h2>
          <p className="mt-4 text-white/80">
            Stop paying for courses. Start learning from peers and building your real-world
            reputation. Sign up free — no card required.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-[#4F46E5] font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm w-full sm:w-auto"
            >
              Get Started for Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 bg-transparent text-white font-semibold rounded-xl border border-white/60 hover:bg-white/10 transition-colors text-sm w-full sm:w-auto"
            >
              Log In
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/70">No money. No subscription. Time credits only.</p>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
      <footer className="bg-[#1E3A5F] py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <span className="text-xl font-bold text-white font-['Geist']">SkillSwap</span>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
              The peer skill exchange platform for OAU students. Time credits, not money.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/match" className="hover:text-white transition-colors">Browse Skills</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><span className="text-slate-500">Leaderboard (future)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Community</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><span className="hover:text-white transition-colors cursor-default">About SkillSwap</span></li>
              <li><Link href="#for-students" className="hover:text-white transition-colors">For Students</Link></li>
              <li><span className="hover:text-white transition-colors cursor-default">Trust and Safety</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Privacy Policy</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li><span className="text-slate-500">Help Centre (future)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Contact</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
          © 2025 SkillSwap · Built for OAU Students · Department of Computer Science and Engineering
        </div>
      </footer>
    </div>
  )
}
