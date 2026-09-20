'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitVerificationDocuments(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const linkedinUrl = formData.get('linkedinUrl') as string
  const githubUrl = formData.get('githubUrl') as string
  const portfolioUrl = formData.get('portfolioUrl') as string
  const files = formData.getAll('documents') as File[]

  const hasLinks = linkedinUrl || githubUrl || portfolioUrl
  const hasFiles = files.some((f) => f.size > 0)
  if (!hasLinks && !hasFiles) {
    return { error: 'Please provide at least one document or profile link.' }
  }

  await admin.from('users').update({
    linkedin_url: linkedinUrl || null,
    github_url: githubUrl || null,
    portfolio_url: portfolioUrl || null,
    verification_status: 'under_review',
  }).eq('user_id', user.id)

  for (const file of files) {
    if (!file || file.size === 0) continue
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowed.includes(file.type)) continue
    if (file.size > 5 * 1024 * 1024) continue

    const path = `${user.id}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(path, file, { upsert: false })

    if (uploadError || !uploadData) continue

    await admin.from('verification_documents').insert({
      user_id: user.id,
      doc_type: 'certificate',
      file_url: uploadData.path,
      file_name: file.name,
      file_size: file.size,
    })
  }

  revalidatePath('/profile')
  return { success: true }
}
