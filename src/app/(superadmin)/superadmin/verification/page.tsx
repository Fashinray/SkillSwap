import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuperAdminVerificationClient from '@/components/SuperAdminVerificationClient'

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: pendingUsers } = await admin
    .from('users')
    .select(`
      user_id, full_name, email, verification_status,
      linkedin_url, github_url, portfolio_url, created_at,
      user_skills (
        user_skill_id, role, admin_score, proficiency_label,
        skills ( name, tier, category )
      ),
      verification_documents (
        doc_id, doc_type, file_url, file_name, file_size, uploaded_at
      )
    `)
    .in('verification_status', ['pending', 'under_review'])
    .order('created_at', { ascending: true })

  // file_url is a storage path, not a usable URL — 'verification-docs' is a
  // private bucket (see src/lib/actions/verification.ts), so every document
  // needs a signed URL generated before the client can open it.
  const pendingFiltered = await Promise.all(
    (pendingUsers ?? []).map(async (u: any) => {
      const documents = await Promise.all(
        (u.verification_documents ?? []).map(async (doc: any) => {
          const { data: signed, error } = await admin.storage
            .from('verification-docs')
            .createSignedUrl(doc.file_url, 60 * 60) // 1 hour

          if (error) {
            console.error('[verification page] createSignedUrl failed:', doc.file_url, error.message)
          }

          return { ...doc, signed_url: signed?.signedUrl ?? null }
        })
      )

      return {
        ...u,
        teach_skills: (u.user_skills ?? []).filter((s: any) => s.role === 'teach'),
        documents,
      }
    })
  )

  return <SuperAdminVerificationClient pendingUsers={pendingFiltered} />
}
