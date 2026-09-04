export type UserRole = 'user' | 'admin'
export type SkillTier = 'basic' | 'intermediate' | 'advanced'
export type SkillCategory = 'academic_technical' | 'creative' | 'practical_life'
export type UserSkillRole = 'teach' | 'learn'
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled' | 'ghosted' | 'disputed'
export type EscrowStatus = 'pending' | 'locked' | 'released' | 'forfeited' | 'disputed' | 'cancelled'
export type CancellationType = 'full' | 'partial'
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'dismissed'
export type DisputeDecision = 'resolved_teacher_favour' | 'resolved_learner_favour' | 'resolved_split' | 'dismissed'
export type TransactionType = 'credit_grant' | 'escrow_lock' | 'escrow_release' | 'escrow_forfeit' | 'session_earn' | 'session_spend' | 'penalty' | 'refund'
export type AIEvaluationStatus = 'pending' | 'transcribed' | 'scored' | 'failed'

export interface User {
  user_id: string
  email: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  role: UserRole
  credit_balance: number
  reputation_score: number
  is_verified: boolean
  escrow_free_sessions_used: number
  created_at: string
  updated_at: string
}

export interface Skill {
  skill_id: string
  name: string
  tier: SkillTier
  category: SkillCategory
  description: string | null
  created_at: string
}

export interface UserSkill {
  user_skill_id: string
  user_id: string
  skill_id: string
  role: UserSkillRole
  proficiency: number | null
  is_verified: boolean
  created_at: string
}

export interface Match {
  match_id: string
  requester_id: string
  recipient_id: string
  skill_id: string
  status: MatchStatus
  compatibility_score: number | null
  created_at: string
  updated_at: string
}

export interface Session {
  session_id: string
  teacher_id: string
  learner_id: string
  skill_id: string
  scheduled_time: string
  duration_minutes: number
  status: SessionStatus
  chat_room_id: string
  teacher_confirmed: boolean
  learner_confirmed: boolean
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface EscrowRecord {
  escrow_id: string
  session_id: string
  teacher_deposit: number
  learner_deposit: number
  status: EscrowStatus
  cancellation_type: CancellationType | null
  grace_period_expires_at: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  tx_id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_after: number
  session_id: string | null
  escrow_id: string | null
  description: string
  created_at: string
}

export interface ChatMessage {
  msg_id: string
  session_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  created_at: string
}

export interface Review {
  review_id: string
  session_id: string
  rater_id: string
  ratee_id: string
  teaching_quality: number
  punctuality: number
  communication: number
  overall_experience: number
  comment: string | null
  created_at: string
}

export interface AIEvaluation {
  eval_id: string
  session_id: string
  status: AIEvaluationStatus
  teaching_clarity: number | null
  content_coverage: number | null
  engagement_quality: number | null
  responsiveness: number | null
  overall_score: number | null
  feedback_text: string | null
  transcript_text: string | null
  applied_to_reputation: boolean
  created_at: string
  updated_at: string
}

export interface Dispute {
  dispute_id: string
  session_id: string
  filer_id: string
  reason: string
  status: DisputeStatus
  admin_id: string | null
  decision: DisputeDecision | null
  decision_notes: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface PlatformSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}
