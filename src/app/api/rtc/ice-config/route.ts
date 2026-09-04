import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meteredApiKey = process.env.NEXT_PUBLIC_METERED_API_KEY

  // Default STUN-only config (works for most networks)
  const defaultConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }

  // If Metered API key is configured fetch TURN credentials
  if (meteredApiKey && meteredApiKey !== 'YOUR_METERED_API_KEY') {
    try {
      const response = await fetch(
        `https://fashinray.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`
      )
      if (response.ok) {
        const iceServers = await response.json()
        return NextResponse.json({ iceServers })
      }
    } catch (e) {
      console.error('Failed to fetch TURN credentials, falling back to STUN only', e)
    }
  }

  return NextResponse.json(defaultConfig)
}
