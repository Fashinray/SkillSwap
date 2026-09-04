import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const skills = [
  // Academic & Technical — Basic
  { name: 'Microsoft Office', tier: 'basic', category: 'academic_technical', description: 'Word, Excel, PowerPoint basics' },
  { name: 'Google Workspace', tier: 'basic', category: 'academic_technical', description: 'Docs, Sheets, Slides' },
  { name: 'Basic Mathematics', tier: 'basic', category: 'academic_technical', description: 'Arithmetic, algebra, basic statistics' },
  { name: 'Study Skills', tier: 'basic', category: 'academic_technical', description: 'Note-taking, time management, exam prep' },
  // Academic & Technical — Intermediate
  { name: 'Python Programming', tier: 'intermediate', category: 'academic_technical', description: 'Python fundamentals to intermediate level' },
  { name: 'JavaScript', tier: 'intermediate', category: 'academic_technical', description: 'Web development with JS' },
  { name: 'Data Analysis', tier: 'intermediate', category: 'academic_technical', description: 'Data wrangling, visualisation, pandas/Excel' },
  { name: 'Statistics', tier: 'intermediate', category: 'academic_technical', description: 'Inferential stats, hypothesis testing' },
  { name: 'Research Methods', tier: 'intermediate', category: 'academic_technical', description: 'Research design, literature review, citations' },
  { name: 'Web Development', tier: 'intermediate', category: 'academic_technical', description: 'HTML, CSS, basic React' },
  // Academic & Technical — Advanced
  { name: 'Machine Learning', tier: 'advanced', category: 'academic_technical', description: 'ML algorithms, model training, evaluation' },
  { name: 'Database Design', tier: 'advanced', category: 'academic_technical', description: 'SQL, normalisation, query optimisation' },
  { name: 'Network Security', tier: 'advanced', category: 'academic_technical', description: 'Cybersecurity fundamentals and practice' },
  { name: 'Mobile Development', tier: 'advanced', category: 'academic_technical', description: 'Android or iOS app development' },
  // Creative — Basic
  { name: 'Photography Basics', tier: 'basic', category: 'creative', description: 'Composition, lighting, phone photography' },
  { name: 'Social Media Content', tier: 'basic', category: 'creative', description: 'Creating posts, captions, basic design' },
  { name: 'Drawing', tier: 'basic', category: 'creative', description: 'Sketching and basic illustration' },
  // Creative — Intermediate
  { name: 'Graphic Design', tier: 'intermediate', category: 'creative', description: 'Canva, Adobe basics, visual communication' },
  { name: 'Video Editing', tier: 'intermediate', category: 'creative', description: 'Capcut, Premiere Rush, DaVinci Resolve basics' },
  { name: 'Music Production', tier: 'intermediate', category: 'creative', description: 'Beat making, DAW basics, audio production' },
  { name: 'UI/UX Design', tier: 'intermediate', category: 'creative', description: 'Figma, user research, wireframing' },
  // Creative — Advanced
  { name: 'Animation', tier: 'advanced', category: 'creative', description: '2D/3D animation, motion graphics' },
  { name: 'Brand Identity Design', tier: 'advanced', category: 'creative', description: 'Logo, brand system, visual identity' },
  // Practical Life — Basic
  { name: 'Cooking', tier: 'basic', category: 'practical_life', description: 'Everyday Nigerian and continental cooking' },
  { name: 'Time Management', tier: 'basic', category: 'practical_life', description: 'Productivity systems and prioritisation' },
  { name: 'French Language', tier: 'basic', category: 'practical_life', description: 'Conversational French basics' },
  { name: 'Yoruba Language', tier: 'basic', category: 'practical_life', description: 'Yoruba language for non-native speakers' },
  // Practical Life — Intermediate
  { name: 'Public Speaking', tier: 'intermediate', category: 'practical_life', description: 'Presentations, debates, confidence building' },
  { name: 'Entrepreneurship', tier: 'intermediate', category: 'practical_life', description: 'Business planning, validation, pitching' },
  { name: 'Digital Marketing', tier: 'intermediate', category: 'practical_life', description: 'SEO, social ads, email marketing' },
  { name: 'Financial Literacy', tier: 'intermediate', category: 'practical_life', description: 'Budgeting, saving, investments basics' },
  // Practical Life — Advanced
  { name: 'Negotiation', tier: 'advanced', category: 'practical_life', description: 'Negotiation tactics and conflict resolution' },
  { name: 'Leadership', tier: 'advanced', category: 'practical_life', description: 'Team leadership, decision making, influence' },
]

async function main() {
  console.log(`Seeding ${skills.length} skills...`)
  const { error } = await supabase.from('skills').upsert(skills, { onConflict: 'name' })
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  console.log('Skills seeded successfully.')
}

main()
