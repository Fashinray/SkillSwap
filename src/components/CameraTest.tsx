'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'testing' | 'success' | 'error' | 'no-camera'

export default function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup stream when component unmounts
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function runTest() {
    setStatus('testing')
    setErrorMsg('')

    // List available devices
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoDevices)

      if (videoDevices.length === 0) {
        setStatus('no-camera')
        setErrorMsg('No camera detected on this device.')
        return
      }
    } catch {
      // enumerateDevices may need permission first
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile
          ? { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }

      setHasPermission(true)
      setStatus('success')

      // Re-enumerate with permission to get device labels
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      setDevices(allDevices.filter((d) => d.kind === 'videoinput'))

    } catch (err: any) {
      setHasPermission(false)
      setStatus('error')

      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera found on this device.')
        setStatus('no-camera')
      } else if (err.name === 'NotReadableError') {
        setErrorMsg('Camera is in use by another app. Close other apps and try again.')
      } else {
        setErrorMsg(`Error: ${err.name} — ${err.message}`)
      }
    }
  }

  function stopTest() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
    setErrorMsg('')
  }

  const statusConfig = {
    idle: { color: 'text-[#464555]', bg: 'bg-[#eff4ff]', icon: 'videocam', text: 'Camera not tested yet' },
    testing: { color: 'text-[#4f46e5]', bg: 'bg-[#e5eeff]', icon: 'hourglass_top', text: 'Testing camera...' },
    success: { color: 'text-[#006e4b]', bg: 'bg-[#006e4b]/10', icon: 'check_circle', text: 'Camera working' },
    error: { color: 'text-red-600', bg: 'bg-red-50', icon: 'error', text: 'Camera error' },
    'no-camera': { color: 'text-amber-600', bg: 'bg-amber-50', icon: 'videocam_off', text: 'No camera found' },
  }

  const cfg = statusConfig[status]

  return (
    <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 space-y-4 card-shadow">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0b1c30] font-['Geist'] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4f46e5] text-xl">
            camera_video
          </span>
          Camera Test
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium font-['Geist'] flex items-center gap-1 ${cfg.color} ${cfg.bg}`}>
          <span className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {cfg.icon}
          </span>
          {cfg.text}
        </span>
      </div>

      {/* Video preview */}
      <div className="relative bg-[#0b1c30] rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {status !== 'success' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-white/20">
              videocam_off
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <span className="material-symbols-outlined text-lg shrink-0">error</span>
          {errorMsg}
        </div>
      )}

      {/* Device list */}
      {devices.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#464555] uppercase tracking-wide">
            Detected cameras
          </p>
          {devices.map((d, i) => (
            <div key={d.deviceId} className="flex items-center gap-2 text-xs text-[#464555]">
              <span className="material-symbols-outlined text-sm text-[#4f46e5]">
                videocam
              </span>
              {d.label || `Camera ${i + 1}`}
            </div>
          ))}
        </div>
      )}

      {/* Browser and device info */}
      <div className="p-3 bg-[#eff4ff] rounded-xl text-xs text-[#464555] space-y-1">
        <p className="font-semibold text-[#0b1c30] font-['Geist']">Device info</p>
        <p>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Other'}</p>
        <p>Mobile: {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Yes' : 'No'}</p>
        <p>Camera API: {navigator.mediaDevices ? 'Supported' : 'Not supported'}</p>
        <p>Secure context: {window.isSecureContext ? 'Yes (HTTPS)' : 'No (HTTP — camera may be restricted)'}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {status === 'idle' || status === 'error' || status === 'no-camera' ? (
          <button onClick={runTest}
            className="flex-1 py-2.5 bg-[#4f46e5] text-white text-sm font-semibold rounded-xl hover:bg-[#3525cd] transition-colors font-['Geist'] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">videocam</span>
            Test Camera
          </button>
        ) : status === 'testing' ? (
          <button disabled
            className="flex-1 py-2.5 bg-[#4f46e5]/50 text-white text-sm font-semibold rounded-xl font-['Geist'] flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Testing...
          </button>
        ) : (
          <button onClick={stopTest}
            className="flex-1 py-2.5 border border-[#c7c4d8] text-[#464555] text-sm font-semibold rounded-xl hover:bg-[#eff4ff] transition-colors font-['Geist'] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg">stop</span>
            Stop Test
          </button>
        )}
      </div>

      {/* Instructions based on status */}
      {status === 'success' && (
        <p className="text-xs text-[#006e4b] text-center">
          Your camera is working correctly. You can now start a video call in the session room.
        </p>
      )}
      {status === 'error' && (
        <div className="text-xs text-[#464555] space-y-1">
          <p className="font-semibold">How to fix:</p>
          {/iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
            <p>Go to <strong>Settings → Safari → Camera</strong> and set to <strong>Allow</strong>. Then reload this page.</p>
          ) : /Android/i.test(navigator.userAgent) ? (
            <p>Tap the <strong>lock icon</strong> in your browser address bar, tap <strong>Permissions</strong>, and allow Camera access. Then reload.</p>
          ) : (
            <p>Click the <strong>camera icon</strong> in your browser address bar and allow access. Then reload this page.</p>
          )}
        </div>
      )}
    </div>
  )
}
