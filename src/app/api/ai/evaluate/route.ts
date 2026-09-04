import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const SCORING_RUBRIC = `You are an expert educational quality assessor.
Analyse the following teaching session transcript and score the teacher
on five dimensions. Each score must be an integer from 0 to 100.

Scoring dimensions:
1. Teaching Clarity (0-100): How clearly did the teacher explain concepts?
   Did they use good examples, avoid jargon, and check understanding?
2. Content Coverage (0-100): How thoroughly did they cover the topic?
   Did they address the learner's questions and learning objectives?
3. Engagement Quality (0-100): How engaging and interactive was the session?
   Did the teacher encourage participation and maintain interest?
4. Responsiveness (0-100): How well did the teacher respond to the learner?
   Did they adapt explanations based on feedback and confusion?
5. Overall Score (0-100): Your holistic assessment of the teaching quality.

Also write a feedback report of exactly 150-200 words covering:
- Two specific strengths observed in the teaching
- Two specific areas for improvement
- One actionable suggestion for the next session

Respond ONLY with valid JSON in this exact format, no markdown, no preamble:
{
  "teaching_clarity": <integer 0-100>,
  "content_coverage": <integer 0-100>,
  "engagement_quality": <integer 0-100>,
  "responsiveness": <integer 0-100>,
  "overall_score": <integer 0-100>,
  "feedback_text": "<150-200 word feedback report>"
}`

async function computeReputationUpdate(
  userId: string,
  aiOverallScore: number,
  admin: ReturnType<typeof createAdminClient>
) {
  const { data: reviews } = await admin
    .from('reviews')
    .select('teaching_quality, punctuality, communication, overall_experience')
    .eq('ratee_id', userId)

  let newReputation: number

  if (!reviews || reviews.length === 0) {
    // No peer reviews yet — use AI score only
    newReputation = Math.round(aiOverallScore)
  } else {
    const peerScores = reviews.map((r) => {
      const avg = (r.teaching_quality + r.punctuality + r.communication + r.overall_experience) / 4
      return avg * 20
    })
    const peerComponent = peerScores.reduce((a, b) => a + b, 0) / peerScores.length
    // Canonical formula: 0.7 x Peer + 0.3 x AI
    newReputation = Math.round(0.7 * peerComponent + 0.3 * aiOverallScore)
  }

  newReputation = Math.max(0, Math.min(100, newReputation))

  await admin
    .from('users')
    .update({ reputation_score: newReputation })
    .eq('user_id', userId)

  // Recompute trusted status
  await admin.rpc('recompute_trusted_status', { p_user_id: userId })

  return newReputation
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId, transcriptText, teacherId } = await request.json()

  if (!sessionId || !transcriptText || !teacherId) {
    return NextResponse.json({ error: 'sessionId, transcriptText, and teacherId are required' }, { status: 400 })
  }

  // Verify session exists and user is a participant
  const { data: session } = await admin
    .from('sessions')
    .select('session_id, teacher_id, learner_id, status')
    .eq('session_id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status !== 'completed') {
    return NextResponse.json({ error: 'Session must be completed before AI evaluation' }, { status: 400 })
  }
  if (user.id !== session.teacher_id && user.id !== session.learner_id) {
    return NextResponse.json({ error: 'Not a session participant' }, { status: 403 })
  }

  // Check for existing evaluation — idempotency guard
  const { data: existing } = await admin
    .from('ai_evaluations')
    .select('eval_id, status, teaching_clarity, content_coverage, engagement_quality, responsiveness, overall_score, feedback_text, applied_to_reputation')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existing && existing.status === 'scored') {
    return NextResponse.json({
      alreadyScored: true,
      evaluation: existing,
    })
  }

  // Create or update evaluation record with pending status
  let evalId: string

  if (existing) {
    evalId = existing.eval_id
    await admin.from('ai_evaluations')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('eval_id', evalId)
  } else {
    const { data: newEval, error: createError } = await admin
      .from('ai_evaluations')
      .insert({ session_id: sessionId, status: 'pending' })
      .select('eval_id')
      .single()
    if (createError || !newEval) {
      return NextResponse.json({ error: 'Failed to create evaluation record' }, { status: 500 })
    }
    evalId = newEval.eval_id
  }

  // Mark as transcribed (transcript provided directly in demo mode)
  await admin.from('ai_evaluations')
    .update({ status: 'transcribed', updated_at: new Date().toISOString() })
    .eq('eval_id', evalId)

  // Call OpenAI GPT-4o-mini
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SCORING_RUBRIC },
        {
          role: 'user',
          content: `Session transcript:\n\n${transcriptText.slice(0, 8000)}\n\nScore the teacher based on this transcript.`,
        },
      ],
    })

    const rawResponse = completion.choices[0]?.message?.content ?? ''

    let scores: {
      teaching_clarity: number
      content_coverage: number
      engagement_quality: number
      responsiveness: number
      overall_score: number
      feedback_text: string
    }

    try {
      const cleaned = rawResponse.replace(/```json|```/g, '').trim()
      scores = JSON.parse(cleaned)
    } catch {
      await admin.from('ai_evaluations')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('eval_id', evalId)
      return NextResponse.json({ error: 'Failed to parse AI response. Please retry.' }, { status: 500 })
    }

    // Validate scores are in range
    const scoreFields = ['teaching_clarity', 'content_coverage', 'engagement_quality', 'responsiveness', 'overall_score'] as const
    for (const field of scoreFields) {
      const val = scores[field]
      if (typeof val !== 'number' || val < 0 || val > 100) {
        scores[field] = Math.max(0, Math.min(100, Math.round(val) || 50))
      }
    }

    // Store scores — do NOT store transcript text (NDPR compliant default)
    await admin.from('ai_evaluations').update({
      status: 'scored',
      teaching_clarity: scores.teaching_clarity,
      content_coverage: scores.content_coverage,
      engagement_quality: scores.engagement_quality,
      responsiveness: scores.responsiveness,
      overall_score: scores.overall_score,
      feedback_text: scores.feedback_text,
      transcript_text: null, // discarded per NDPR default
      updated_at: new Date().toISOString(),
    }).eq('eval_id', evalId)

    // Apply reputation update if not already applied
    const { data: evalRecord } = await admin
      .from('ai_evaluations')
      .select('applied_to_reputation')
      .eq('eval_id', evalId)
      .single()

    let newReputation: number | null = null
    if (!evalRecord?.applied_to_reputation) {
      newReputation = await computeReputationUpdate(teacherId, scores.overall_score, admin)
      await admin.from('ai_evaluations')
        .update({ applied_to_reputation: true })
        .eq('eval_id', evalId)
    }

    return NextResponse.json({
      success: true,
      evalId,
      scores,
      newReputation,
    })
  } catch (err: any) {
    await admin.from('ai_evaluations')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('eval_id', evalId)
    return NextResponse.json({ error: err.message ?? 'AI evaluation failed' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: evaluation } = await supabase
    .from('ai_evaluations')
    .select('eval_id, status, teaching_clarity, content_coverage, engagement_quality, responsiveness, overall_score, feedback_text, applied_to_reputation, created_at, updated_at')
    .eq('session_id', sessionId)
    .maybeSingle()

  return NextResponse.json({ evaluation })
}
