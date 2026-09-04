'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { confirmCompletion, cancelSession, fileDispute, uploadSessionFile } from '@/lib/actions/session'
import Link from 'next/link'
import PeerReviewForm from '@/components/PeerReviewForm'
import AIEvaluationPanel from '@/components/AIEvaluationPanel'

interface Message {
  msg_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
}

interface Session {
  session_id: string
  teacher_id: string
  learner_id: string
  chat_room_id: string
  status: string
  teacher_confirmed: boolean
  learner_confirmed: boolean
  scheduled_time: string
  duration_minutes: number
}

interface OtherUser {
  full_name: string
  reputation_score: number
  is_trusted: boolean
}

interface Skill {
  name: string
  tier: string
}

const PRESENTER_TURN_MS = 60 * 60 * 1000 // 1 hour per presenting turn

type RTCSignalMessage =
  | { type: 'offer'; sdp: string; from: string }
  | { type: 'answer'; sdp: string; from: string }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit; from: string }
  | { type: 'call-request'; from: string }
  | { type: 'call-accepted'; from: string }
  | { type: 'call-ended'; from: string }
  | { type: 'screen-share-started'; from: string; startedAt: number }
  | { type: 'screen-share-stopped'; from: string }
  | { type: 'presenter-changed'; presenterId: string; from: string }

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function SessionRoom({
  session,
  currentUserId,
  otherUser,
  skill,
  initialMessages,
}: {
  session: Session
  currentUserId: string
  otherUser: OtherUser
  skill: Skill
  initialMessages: Message[]
}) {
  const supabase = createClient()

  // Chat state
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Session state
  const [sessionStatus, setSessionStatus] = useState(session.status)
  const [myConfirmed, setMyConfirmed] = useState(
    currentUserId === session.teacher_id
      ? session.teacher_confirmed
      : session.learner_confirmed
  )
  const [actionMsg, setActionMsg] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)

  // WebRTC state
  const [callState, setCallState] = useState<'idle' | 'calling' | 'in-call' | 'receiving'>('idle')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [audioOnly, setAudioOnly] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)
  // Mirrors `localStream` state so the persistent signalling channel's
  // handler (subscribed once on mount, see below) always reads the current
  // stream instead of the null it was created with.
  const localStreamRef = useRef<MediaStream | null>(null)
  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  // Binds the local camera preview once its <video> element actually
  // exists. startCall() sets localStream and callState in the same tick,
  // but the <video ref={localVideoRef}> element only renders once
  // callState becomes 'in-call' — assigning srcObject inline inside
  // startCall (before that render happens) would silently do nothing.
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, callState])

  // Screen share / presenter turn state
  // The teacher presents first; presenting can be handed off once a
  // turn's countdown expires, via an explicit confirmation from the
  // other party (never a silent forced switch).
  const [presenterId, setPresenterId] = useState(session.teacher_id)
  const [isSharingActive, setIsSharingActive] = useState(false)
  const [turnStartedAt, setTurnStartedAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [showHandoffPrompt, setShowHandoffPrompt] = useState(false)
  const screenStreamRef = useRef<MediaStream | null>(null)

  const isActive = ['scheduled', 'active'].includes(sessionStatus)
  const isPresenter = currentUserId === presenterId
  const presenterName = isPresenter ? 'You' : otherUser.full_name

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to new chat messages via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${session.chat_room_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${session.session_id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.msg_id === payload.new.msg_id)
            if (exists) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.session_id, session.chat_room_id])

  // Presenter-turn countdown — ticks locally from a shared start timestamp
  // so both sides stay in sync without a server round trip each second.
  useEffect(() => {
    if (turnStartedAt == null) {
      setRemainingSeconds(null)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, PRESENTER_TURN_MS - (Date.now() - turnStartedAt))
      setRemainingSeconds(Math.ceil(remaining / 1000))
      if (remaining <= 0 && currentUserId !== presenterId) {
        setShowHandoffPrompt(true)
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [turnStartedAt, presenterId, currentUserId])

  function revertToCamera() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }
    const pc = peerConnectionRef.current
    const sender = pc?.getSenders().find((s) => s.track?.kind === 'video')
    const camTrack = localStreamRef.current?.getVideoTracks()[0]
    if (sender && camTrack) {
      sender.replaceTrack(camTrack).catch((e) => console.error('Error reverting to camera', e))
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }

  // WebRTC signalling channel via Supabase Realtime broadcast — subscribed
  // once when the room is opened (not lazily inside startCall) so an
  // incoming call-request can actually be received before either side has
  // clicked anything. Everything the handler touches is read through refs
  // or stable setState setters, so one long-lived subscription is safe.
  useEffect(() => {
    const channel = supabase.channel(`rtc:${session.session_id}`, {
      config: { broadcast: { self: false } },
    })

    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const msg = payload as RTCSignalMessage
      if (msg.from === currentUserId) return

      const pc = peerConnectionRef.current

      if (msg.type === 'call-request') {
        setCallState('receiving')
      } else if (msg.type === 'call-accepted') {
        if (pc) await createAndSendOffer(pc, channel)
      } else if (msg.type === 'call-ended') {
        endCall()
      } else if (msg.type === 'offer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp }))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'answer', sdp: answer.sdp!, from: currentUserId },
        })
      } else if (msg.type === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.sdp }))
      } else if (msg.type === 'ice-candidate' && pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
        } catch (e) {
          console.error('ICE candidate error', e)
        }
      } else if (msg.type === 'screen-share-started') {
        setIsSharingActive(true)
        setTurnStartedAt(msg.startedAt)
      } else if (msg.type === 'screen-share-stopped') {
        setIsSharingActive(false)
        setTurnStartedAt(null)
        setShowHandoffPrompt(false)
      } else if (msg.type === 'presenter-changed') {
        // If I was presenting, hand my track back to camera now that
        // presenting has moved to the other party.
        if (screenStreamRef.current) revertToCamera()
        setPresenterId(msg.presenterId)
        setIsSharingActive(false)
        setTurnStartedAt(null)
        setShowHandoffPrompt(false)
      }
    })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.session_id, currentUserId])

  async function createAndSendOffer(pc: RTCPeerConnection, channel: any) {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'offer', sdp: offer.sdp!, from: currentUserId },
    })
  }

  async function getIceConfig() {
    try {
      const res = await fetch('/api/rtc/ice-config')
      return await res.json()
    } catch {
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      }
    }
  }

  async function startCall(isInitiator: boolean) {
    const iceConfig = await getIceConfig()
    const pc = new RTCPeerConnection(iceConfig)
    peerConnectionRef.current = pc

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !audioOnly,
        audio: true,
      })
      setLocalStream(stream)
      stream.getTracks().forEach((track) => pc.addTrack(track, stream))
    } catch (e) {
      console.error('Media access error', e)
      setActionMsg('Could not access camera/microphone. Check permissions.')
      return
    }

    pc.ontrack = (event) => {
      const remote = event.streams[0]
      setRemoteStream(remote)
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote
    }

    const channel = channelRef.current
    if (!channel) {
      setActionMsg('Not connected to the session room yet — please try again in a moment.')
      return
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
            from: currentUserId,
          },
        })
      }
    }

    setCallState('in-call')

    if (isInitiator) {
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'call-request', from: currentUserId },
      })
    }
  }

  function endCall() {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop())
      screenStreamRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    setRemoteStream(null)
    setCallState('idle')
    setIsSharingActive(false)
    setTurnStartedAt(null)
    setShowHandoffPrompt(false)
    // Only tear down the call itself here — channelRef is the room's
    // persistent signalling channel (set up on mount) and stays subscribed
    // so a new call can still be started/received afterwards.
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'call-ended', from: currentUserId },
    })
  }

  async function acceptCall() {
    await startCall(false)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'call-accepted', from: currentUserId },
    })
  }

  async function startScreenShare() {
    if (callState !== 'in-call' || !isPresenter) return
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const screenTrack = screenStream.getVideoTracks()[0]
      screenStreamRef.current = screenStream

      const pc = peerConnectionRef.current
      const sender = pc?.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) await sender.replaceTrack(screenTrack)
      if (localVideoRef.current) localVideoRef.current.srcObject = screenStream

      // Native "Stop sharing" browser control also needs to revert us
      screenTrack.onended = () => stopScreenShare()

      const startedAt = turnStartedAt ?? Date.now()
      setIsSharingActive(true)
      setTurnStartedAt(startedAt)
      setShowHandoffPrompt(false)
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'screen-share-started', from: currentUserId, startedAt },
      })
    } catch (e) {
      console.error('Screen share error', e)
      setActionMsg('Could not start screen sharing.')
    }
  }

  function stopScreenShare() {
    revertToCamera()
    setIsSharingActive(false)
    setTurnStartedAt(null)
    setShowHandoffPrompt(false)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'screen-share-stopped', from: currentUserId },
    })
  }

  function handleTakeOver() {
    setPresenterId(currentUserId)
    setShowHandoffPrompt(false)
    setTurnStartedAt(null)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type: 'presenter-changed', presenterId: currentUserId, from: currentUserId },
    })
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      session_id: session.session_id,
      sender_id: currentUserId,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingFile(true)
    setActionMsg('')
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadSessionFile(session.session_id, formData)
    if (result?.error) setActionMsg(result.error)
    setUploadingFile(false)
  }

  async function handleConfirm() {
    setActionLoading('confirm')
    setActionMsg('')
    const result = await confirmCompletion(session.session_id)
    if (result?.error) setActionMsg(result.error)
    else {
      const r = result.result as any
      if (r?.status === 'completed') {
        setSessionStatus('completed')
        setActionMsg(`Done! ${r.credits_transferred} credits transferred.`)
      } else {
        setMyConfirmed(true)
        setActionMsg('Your confirmation recorded. Waiting for the other party.')
      }
    }
    setActionLoading(null)
  }

  async function handleCancel() {
    if (!confirm('Cancel this session?')) return
    setActionLoading('cancel')
    const result = await cancelSession(session.session_id)
    if (result?.error) setActionMsg(result.error)
    else {
      setSessionStatus('cancelled')
      setActionMsg('Session cancelled.')
    }
    setActionLoading(null)
  }

  async function handleDispute() {
    if (!disputeReason.trim()) { setActionMsg('Please describe the issue.'); return }
    setActionLoading('dispute')
    const result = await fileDispute(session.session_id, disputeReason)
    if (result?.error) setActionMsg(result.error)
    else {
      setSessionStatus('disputed')
      setActionMsg('Dispute filed. An admin will review.')
      setShowDisputeForm(false)
    }
    setActionLoading(null)
  }

  const tierColors: Record<string, string> = {
    basic: 'text-green-600',
    intermediate: 'text-yellow-600',
    advanced: 'text-red-600',
  }

  const videoPanel = (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">Video Call</h2>
        {isSharingActive && remainingSeconds !== null && (
          <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            🖥 {presenterName} presenting · {formatTime(remainingSeconds)}
          </span>
        )}
      </div>

      {callState === 'in-call' && (
        <div className="space-y-2">
          <div
            className={`relative bg-black rounded-lg overflow-hidden ${
              isSharingActive ? 'aspect-video max-h-[65vh]' : 'aspect-video'
            }`}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 w-24 h-16 object-cover rounded-lg border-2 border-white"
            />
          </div>

          {isPresenter ? (
            isSharingActive ? (
              <button
                onClick={stopScreenShare}
                className="w-full py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Stop Sharing Screen
              </button>
            ) : (
              <button
                onClick={startScreenShare}
                className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Share Screen
              </button>
            )
          ) : (
            !isSharingActive && (
              <p className="text-xs text-gray-400 text-center">
                Waiting for {otherUser.full_name} to share their screen.
              </p>
            )
          )}

          {isPresenter && remainingSeconds === 0 && (
            <p className="text-xs text-amber-600 text-center">
              Your presenting time is up — {otherUser.full_name} can take over any time.
            </p>
          )}

          {showHandoffPrompt && !isPresenter && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-amber-800">
                {otherUser.full_name}&apos;s hour of presenting is up.
              </p>
              <button
                onClick={handleTakeOver}
                className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Start Presenting
              </button>
            </div>
          )}

          <button
            onClick={endCall}
            className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            End Call
          </button>
        </div>
      )}

      {callState === 'receiving' && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-gray-700">
            {otherUser.full_name} is calling...
          </p>
          <div className="flex gap-2">
            <button
              onClick={acceptCall}
              className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
            >
              Accept
            </button>
            <button
              onClick={endCall}
              className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {callState === 'calling' && (
        <p className="text-sm text-gray-500 text-center">Calling...</p>
      )}

      {callState === 'idle' && isActive && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
              className="rounded"
            />
            Audio only (low bandwidth)
          </label>
          <button
            onClick={() => startCall(true)}
            className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Start Call
          </button>
        </div>
      )}

      {!isActive && (
        <p className="text-sm text-gray-400">
          Video call available during active sessions.
        </p>
      )}
    </div>
  )

  const sessionControlsPanel = isActive && (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h2 className="font-semibold text-gray-900 text-sm">Session Controls</h2>

      <div className="text-xs text-gray-500 space-y-1">
        <p>Your confirmation: {myConfirmed ? '✓ Done' : '⏳ Pending'}</p>
      </div>

      {!myConfirmed && (
        <button
          onClick={handleConfirm}
          disabled={actionLoading === 'confirm'}
          className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {actionLoading === 'confirm' ? 'Confirming...' : 'Confirm Complete'}
        </button>
      )}

      <button
        onClick={handleCancel}
        disabled={actionLoading === 'cancel'}
        className="w-full py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Session'}
      </button>

      {!showDisputeForm ? (
        <button
          onClick={() => setShowDisputeForm(true)}
          className="w-full text-xs text-red-500 hover:underline"
        >
          File a dispute
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={2}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          />
          <button
            onClick={handleDispute}
            disabled={actionLoading === 'dispute'}
            className="w-full py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading === 'dispute' ? 'Filing...' : 'Submit Dispute'}
          </button>
          <button
            onClick={() => setShowDisputeForm(false)}
            className="w-full text-xs text-gray-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {actionMsg && (
        <p className="text-xs text-emerald-600">{actionMsg}</p>
      )}
    </div>
  )

  const chatPanel = (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.msg_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              }`}>
                {msg.content && <p>{msg.content}</p>}
                {msg.file_url && (
                  <a
                    href={msg.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-xs"
                  >
                    📎 {msg.file_name ?? 'Attachment'}
                  </a>
                )}
                <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {isActive && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              title="Share a file"
              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {uploadingFile ? '…' : '📎'}
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-gray-900">
              Session with{' '}
              <Link
                href={`/profile/${session.teacher_id === currentUserId ? session.learner_id : session.teacher_id}`}
                className="text-indigo-600 hover:underline"
              >
                {otherUser.full_name}
              </Link>
            </h1>
            {otherUser.is_trusted && (
              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                ✓ Trusted
              </span>
            )}
          </div>
          <p className={`text-sm font-medium ${tierColors[skill?.tier ?? 'basic']}`}>
            {skill?.name} · {skill?.tier}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(session.scheduled_time).toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long',
              hour: '2-digit', minute: '2-digit',
            })} · {session.duration_minutes} min
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            sessionStatus === 'completed' ? 'bg-gray-100 text-gray-600' :
            sessionStatus === 'active' ? 'bg-green-100 text-green-700' :
            sessionStatus === 'disputed' ? 'bg-yellow-100 text-yellow-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {sessionStatus}
          </span>
          <Link href="/sessions" className="text-xs text-gray-400 hover:underline">
            ← Back to sessions
          </Link>
        </div>
      </div>

      {isSharingActive ? (
        <div className="space-y-4">
          {videoPanel}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">{chatPanel}</div>
            <div>{sessionControlsPanel}</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">{chatPanel}</div>
          <div className="space-y-4">
            {videoPanel}
            {sessionControlsPanel}
          </div>
        </div>
      )}

      {/* Peer review section */}
      {sessionStatus === 'completed' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <PeerReviewForm
            sessionId={session.session_id}
            rateeId={
              currentUserId === session.teacher_id
                ? session.learner_id
                : session.teacher_id
            }
            rateeName={otherUser.full_name}
            existingReview={false}
          />
        </div>
      )}

      {/* AI Evaluation panel */}
      {sessionStatus === 'completed' && (
        <AIEvaluationPanel
          sessionId={session.session_id}
          teacherId={session.teacher_id}
          currentUserId={currentUserId}
          sessionStatus={sessionStatus}
        />
      )}
    </div>
  )
}
