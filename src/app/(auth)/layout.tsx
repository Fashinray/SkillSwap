export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand side, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16"
        style={{ background: 'linear-gradient(135deg, #3525cd 0%, #4f46e5 50%, #6b38d4 100%)' }}>
        {/* Atmospheric blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[120px]"
          style={{ background: '#6b38d4' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px]"
          style={{ background: '#67f4b7' }} />

        <div className="relative z-10 max-w-lg text-white">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">swap_horiz</span>
            </div>
            <span className="text-2xl font-bold font-['Geist']">SkillSwap</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium mb-8">
            <span className="material-symbols-outlined text-sm">verified</span>
            OAU Trusted Network · No money required
          </div>

          <h1 className="text-5xl font-extrabold leading-tight mb-6 font-['Geist']">
            Exchange Skills.<br />
            Earn Credits.<br />
            Build Reputation.
          </h1>

          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Learn from fellow students and teach what you know — without spending money.
            Join the campus skill exchange economy today.
          </p>

          {/* Floating glass cards */}
          <div className="relative h-48">
            <div className="glass-card absolute top-0 left-0 p-4 rounded-xl w-48 animate-float"
              style={{ animationDelay: '0s' }}>
              <div className="bg-[#4f46e5]/20 p-2 rounded-lg inline-block mb-2">
                <span className="material-symbols-outlined text-white text-lg">code</span>
              </div>
              <div className="text-sm font-semibold text-[#0b1c30] font-['Geist']">Python Mastery</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[#006e4b] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-xs text-[#464555]">Intermediate · 2 cr/hr</span>
              </div>
            </div>

            <div className="glass-card absolute bottom-0 right-0 p-4 rounded-xl w-52 animate-float"
              style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#464555] uppercase tracking-wider font-['Geist'] font-medium">Credit Wallet</span>
                <span className="material-symbols-outlined text-[#4f46e5] text-lg">account_balance_wallet</span>
              </div>
              <div className="text-2xl font-bold text-[#4f46e5] font-['Geist']">24</div>
              <div className="text-xs text-[#006e4b] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                +5 this week
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              {['A', 'E', 'C', 'T'].map((l, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold">
                  {l}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                +16
              </div>
            </div>
            <p className="text-sm text-white/90 font-['Geist'] font-medium">
              20+ OAU students already swapping
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-[#f8f9ff]">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">swap_horiz</span>
            </div>
            <span className="text-xl font-bold text-[#4f46e5] font-['Geist']">SkillSwap</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
