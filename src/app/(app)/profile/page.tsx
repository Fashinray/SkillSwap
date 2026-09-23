import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import SkillManager from '@/components/SkillManager'
import AvailabilityManager from '@/components/AvailabilityManager'
import CompleteVerification from '@/components/CompleteVerification'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, bio, avatar_url, credit_balance, reputation_score, admin_verified, verification_status, linkedin_url, github_url, portfolio_url')
    .eq('user_id', user.id)
    .single()

  // verification_status is one of 'pending' | 'under_review' | 'verified' |
  // 'rejected' (supabase/migrations/011_superadmin_and_verification.sql) —
  // show the fallback form for anyone not already admin-verified and not
  // currently sitting in the admin's under_review queue (i.e. 'pending',
  // the column's own default for anyone who skipped/failed Step 2, or
  // 'rejected', who need to resubmit).
  const needsVerification =
    !profile?.admin_verified &&
    profile?.verification_status !== 'under_review' &&
    profile?.verification_status !== 'verified'

  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('user_skill_id, role, proficiency, skills(skill_id, name, tier, category)')
    .eq('user_id', user.id)

  const { data: allSkills } = await supabase
    .from('skills')
    .select('skill_id, name, tier, category')
    .order('category')
    .order('name')

  const { data: availability } = await supabase
    .from('availability_slots')
    .select('slot_id, weekday, start_min, end_min')
    .eq('user_id', user.id)
    .order('weekday')
    .order('start_min')

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Basic Info</h2>
        <ProfileForm profile={profile} />
      </div>

      {needsVerification && (
        <CompleteVerification
          linkedinUrl={profile?.linkedin_url ?? null}
          githubUrl={profile?.github_url ?? null}
          portfolioUrl={profile?.portfolio_url ?? null}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Skills</h2>
        <SkillManager
          userSkills={(userSkills ?? []) as any}
          allSkills={allSkills ?? []}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Availability</h2>
        <AvailabilityManager slots={availability ?? []} />
      </div>
    </div>
  )
}
