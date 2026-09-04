import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const profiles = [
  { name: 'Amaka Okonkwo', bio: 'CS student, love Python and data analysis. Looking to improve my design skills.', teachSkills: ['Python Programming', 'Data Analysis', 'Statistics'], learnSkills: ['Graphic Design', 'UI/UX Design'], availability: [{weekday:1,start_min:480,end_min:600},{weekday:3,start_min:480,end_min:600}] },
  { name: 'Emeka Nwosu', bio: 'Final year engineering student. Great at maths, want to learn web dev.', teachSkills: ['Basic Mathematics', 'Statistics', 'Research Methods'], learnSkills: ['Web Development', 'JavaScript'], availability: [{weekday:2,start_min:600,end_min:720},{weekday:4,start_min:600,end_min:720}] },
  { name: 'Chioma Eze', bio: 'Graphics designer who wants to learn coding to build my own portfolio site.', teachSkills: ['Graphic Design', 'Brand Identity Design', 'Social Media Content'], learnSkills: ['Python Programming', 'Web Development'], availability: [{weekday:1,start_min:900,end_min:1020},{weekday:5,start_min:480,end_min:600}] },
  { name: 'Tunde Adeyemi', bio: 'Music producer and entrepreneur. Happy to teach music and business skills.', teachSkills: ['Music Production', 'Entrepreneurship', 'Financial Literacy'], learnSkills: ['Data Analysis', 'Digital Marketing'], availability: [{weekday:6,start_min:480,end_min:720},{weekday:0,start_min:600,end_min:780}] },
  { name: 'Ngozi Obi', bio: 'Public health student. Fluent in Yoruba, great at public speaking.', teachSkills: ['Public Speaking', 'Yoruba Language', 'Research Methods'], learnSkills: ['Python Programming', 'Statistics'], availability: [{weekday:2,start_min:480,end_min:600},{weekday:4,start_min:480,end_min:600}] },
  { name: 'Seun Akinwale', bio: 'Front-end developer in training. Want to improve my data skills.', teachSkills: ['Web Development', 'JavaScript', 'UI/UX Design'], learnSkills: ['Data Analysis', 'Machine Learning'], availability: [{weekday:1,start_min:1080,end_min:1200},{weekday:3,start_min:1080,end_min:1200}] },
  { name: 'Bola Fasanya', bio: 'Mathematics tutor looking to transition into tech.', teachSkills: ['Basic Mathematics', 'Statistics', 'Study Skills'], learnSkills: ['Python Programming', 'Machine Learning'], availability: [{weekday:2,start_min:780,end_min:900},{weekday:5,start_min:780,end_min:900}] },
  { name: 'Kemi Adebayo', bio: 'Videographer and editor. Also fluent in French.', teachSkills: ['Video Editing', 'Photography Basics', 'French Language'], learnSkills: ['Graphic Design', 'Social Media Content'], availability: [{weekday:3,start_min:600,end_min:720},{weekday:6,start_min:600,end_min:780}] },
  { name: 'Dayo Ogunlade', bio: 'Database admin student. Looking to improve leadership and soft skills.', teachSkills: ['Database Design', 'Python Programming', 'Network Security'], learnSkills: ['Leadership', 'Public Speaking', 'Negotiation'], availability: [{weekday:1,start_min:600,end_min:720},{weekday:4,start_min:600,end_min:720}] },
  { name: 'Funmi Bankole', bio: 'Digital marketer and brand strategist. Want to learn data analysis.', teachSkills: ['Digital Marketing', 'Brand Identity Design', 'Social Media Content'], learnSkills: ['Data Analysis', 'Statistics', 'Python Programming'], availability: [{weekday:2,start_min:480,end_min:600},{weekday:5,start_min:480,end_min:600}] },
  { name: 'Yemi Oladele', bio: 'Mobile developer keen to share Android skills. Learning AI.', teachSkills: ['Mobile Development', 'JavaScript', 'Web Development'], learnSkills: ['Machine Learning', 'Data Analysis'], availability: [{weekday:3,start_min:900,end_min:1020},{weekday:6,start_min:900,end_min:1080}] },
  { name: 'Ife Adeyinka', bio: 'Animation student, love drawing and visual storytelling.', teachSkills: ['Animation', 'Drawing', 'Graphic Design'], learnSkills: ['Video Editing', 'Music Production'], availability: [{weekday:1,start_min:780,end_min:900},{weekday:4,start_min:780,end_min:900}] },
  { name: 'Rotimi Okafor', bio: 'Entrepreneur and negotiation coach. Looking to upskill in tech.', teachSkills: ['Entrepreneurship', 'Negotiation', 'Leadership'], learnSkills: ['Python Programming', 'Database Design'], availability: [{weekday:2,start_min:900,end_min:1020},{weekday:5,start_min:900,end_min:1020}] },
  { name: 'Adaeze Nwofor', bio: 'French tutor and language enthusiast. Learning UI design.', teachSkills: ['French Language', 'Public Speaking', 'Study Skills'], learnSkills: ['UI/UX Design', 'Graphic Design'], availability: [{weekday:1,start_min:480,end_min:600},{weekday:3,start_min:480,end_min:600},{weekday:5,start_min:480,end_min:600}] },
  { name: 'Gbenga Afolabi', bio: 'Cybersecurity student. Can teach network security and help with maths.', teachSkills: ['Network Security', 'Database Design', 'Basic Mathematics'], learnSkills: ['Machine Learning', 'Mobile Development'], availability: [{weekday:2,start_min:600,end_min:780},{weekday:4,start_min:600,end_min:780}] },
  { name: 'Sola Adewumi', bio: 'Finance student sharing money skills. Want to learn data and coding.', teachSkills: ['Financial Literacy', 'Entrepreneurship', 'Time Management'], learnSkills: ['Python Programming', 'Data Analysis', 'Statistics'], availability: [{weekday:3,start_min:480,end_min:600},{weekday:6,start_min:480,end_min:600}] },
  { name: 'Temi Ogundimu', bio: 'Cook and lifestyle blogger. Teaching cooking and social media.', teachSkills: ['Cooking', 'Social Media Content', 'Time Management'], learnSkills: ['Digital Marketing', 'Video Editing'], availability: [{weekday:0,start_min:600,end_min:780},{weekday:6,start_min:600,end_min:780}] },
  { name: 'Kunle Adegoke', bio: 'ML researcher sharing advanced Python and stats knowledge.', teachSkills: ['Machine Learning', 'Python Programming', 'Statistics'], learnSkills: ['Leadership', 'Public Speaking', 'Negotiation'], availability: [{weekday:1,start_min:1080,end_min:1200},{weekday:4,start_min:1080,end_min:1200}] },
  { name: 'Lara Okonkwo', bio: 'Photography and brand design professional in training.', teachSkills: ['Photography Basics', 'Brand Identity Design', 'Drawing'], learnSkills: ['Web Development', 'Digital Marketing'], availability: [{weekday:2,start_min:780,end_min:900},{weekday:5,start_min:780,end_min:900}] },
  { name: 'Wale Adekunle', bio: 'Google Workspace power user and study skills coach.', teachSkills: ['Google Workspace', 'Microsoft Office', 'Study Skills'], learnSkills: ['Python Programming', 'Web Development', 'Data Analysis'], availability: [{weekday:1,start_min:600,end_min:720},{weekday:3,start_min:600,end_min:720},{weekday:5,start_min:600,end_min:720}] },
]

async function getSkillId(name: string): Promise<string | null> {
  const { data } = await admin.from('skills').select('skill_id').eq('name', name).single()
  return data?.skill_id ?? null
}

async function main() {
  console.log('Seeding 20 test user profiles...')
  for (const profile of profiles) {
    const email = `${profile.name.toLowerCase().replace(/\s+/g, '.')}@skillswap.test`

    const { data: existing } = await admin.auth.admin.listUsers()
    const alreadyExists = existing?.users?.some((u) => u.email === email)
    if (alreadyExists) {
      console.log(`Skipping ${profile.name} — already exists`)
      continue
    }

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: 'SkillSwap2024!',
      email_confirm: true,
      user_metadata: { full_name: profile.name },
    })

    if (authError) {
      console.log(`Skipping ${profile.name}: ${authError.message}`)
      continue
    }

    const userId = authData.user.id
    console.log(`Created: ${profile.name} (${userId})`)
    await new Promise((r) => setTimeout(r, 1000))

    const newBalance = 5
    await admin.from('users').update({
      bio: profile.bio,
      is_verified: true,
      credit_balance: newBalance,
      reputation_score: 45 + Math.floor(Math.random() * 15),
    }).eq('user_id', userId)

    await admin.from('transactions').insert({
      user_id: userId,
      type: 'credit_grant',
      amount: 5,
      balance_after: newBalance,
      description: 'Starter credits granted on email verification',
    })

    for (const skillName of profile.teachSkills) {
      const skillId = await getSkillId(skillName)
      if (!skillId) continue
      await admin.from('user_skills').upsert({
        user_id: userId, skill_id: skillId, role: 'teach',
        proficiency: 3 + Math.floor(Math.random() * 3),
      }, { onConflict: 'user_id,skill_id,role' })
    }

    for (const skillName of profile.learnSkills) {
      const skillId = await getSkillId(skillName)
      if (!skillId) continue
      await admin.from('user_skills').upsert({
        user_id: userId, skill_id: skillId, role: 'learn', proficiency: null,
      }, { onConflict: 'user_id,skill_id,role' })
    }

    if (profile.availability.length > 0) {
      await admin.from('availability_slots').insert(
        profile.availability.map((s) => ({ user_id: userId, ...s }))
      )
    }
    console.log(`  Done: ${profile.name}`)
  }
  console.log('\nAll 20 profiles seeded.')
}

main().catch(console.error)
