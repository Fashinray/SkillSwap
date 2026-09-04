'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const bio = formData.get('bio') as string
  const avatarUrl = formData.get('avatarUrl') as string | null

  const { error } = await supabase
    .from('users')
    .update({ bio, avatar_url: avatarUrl })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function addUserSkill(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const skillId = formData.get('skillId') as string
  const role = formData.get('role') as 'teach' | 'learn'
  const proficiency = formData.get('proficiency')
    ? parseInt(formData.get('proficiency') as string)
    : null

  const { error } = await supabase.from('user_skills').insert({
    user_id: user.id,
    skill_id: skillId,
    role,
    proficiency,
  })

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function removeUserSkill(userSkillId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_skill_id', userSkillId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function setAvailability(slots: {
  weekday: number
  start_min: number
  end_min: number
}[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  await admin
    .from('availability_slots')
    .delete()
    .eq('user_id', user.id)

  if (slots.length === 0) {
    revalidatePath('/profile')
    return { success: true }
  }

  const rows = slots.map((s) => ({
    user_id: user.id,
    weekday: s.weekday,
    start_min: s.start_min,
    end_min: s.end_min,
  }))

  const { error } = await admin.from('availability_slots').insert(rows)
  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
