import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/AppSidebar'
import AppNav from '@/components/AppNav'
import AppBottomNav from '@/components/AppBottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, credit_balance, reputation_score, role')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <AppSidebar user={profile} />
      <AppNav user={profile} />
      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
      <AppBottomNav role={profile?.role} />
    </div>
  )
}
