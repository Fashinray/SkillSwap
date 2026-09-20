import CameraTest from '@/components/CameraTest'

export default function CameraTestPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b1c30] font-['Geist']">
          Camera Test
        </h1>
        <p className="text-sm text-[#464555] mt-1">
          Test your camera and microphone before joining a session room.
          Make sure you are on a secure connection (HTTPS) for best results.
        </p>
      </div>

      <CameraTest />

      <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 card-shadow">
        <h2 className="font-semibold text-[#0b1c30] font-['Geist'] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4f46e5] text-xl">help</span>
          Camera not working?
        </h2>
        <div className="space-y-3 text-sm text-[#464555]">
          <div>
            <p className="font-semibold text-[#0b1c30] font-['Geist']">On iPhone or iPad</p>
            <p>Go to Settings → Safari → Camera and set to Allow. Reload the page after changing.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0b1c30] font-['Geist']">On Android</p>
            <p>Tap the lock icon in the address bar → Permissions → Allow Camera. Reload the page.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0b1c30] font-['Geist']">On desktop Chrome</p>
            <p>Click the camera icon in the address bar and select Always allow. Reload the page.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0b1c30] font-['Geist']">Camera used by another app</p>
            <p>Close Zoom, Teams, or any other app that might be using your camera. Then reload.</p>
          </div>
          <div>
            <p className="font-semibold text-[#0b1c30] font-['Geist']">On a local network (not HTTPS)</p>
            <p>Some browsers restrict camera access over plain HTTP. Camera access works fully when the app is deployed to a secure HTTPS URL.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
