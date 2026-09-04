import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import SkillManager from '@/components/SkillManager'
import AvailabilityManager from '@/components/AvailabilityManager'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, bio, avatar_url, credit_balance, reputation_score')
    .eq('user_id', user.id)
    .single()

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
