import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey || apiKey === 'YOUR_ASSEMBLYAI_API_KEY') {
    return NextResponse.json({
      error: 'AssemblyAI API key not configured. Use demo mode instead.',
      demoMode: true,
    }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const client = new AssemblyAI({ apiKey })

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      language_code: 'en',
      speaker_labels: true,
    })

    if (transcript.status === 'error') {
      return NextResponse.json({ error: transcript.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      text: transcript.text,
      words: transcript.words?.length ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
