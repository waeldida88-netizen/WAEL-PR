'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'
import { useSocket } from '@/lib/socket'
import jsQR from 'jsqr'

export default function ScannerPage() {
  const params = useParams()
  const eventId = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scanning, setScanning] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [checkedInGuests, setCheckedInGuests] = useState<any[]>([])
  const { socket } = useSocket()

  useEffect(() => {
    startCamera()
  }, [])

  useEffect(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return

    const interval = setInterval(() => {
      scanQRCode()
    }, 500)

    return () => clearInterval(interval)
  }, [scanning])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'فشل الوصول إلى الكاميرا' })
      console.error('Failed to access camera:', error)
    }
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    if (!video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      handleQRCodeScanned(code.data)
    }
  }

  const handleQRCodeScanned = async (qrData: string) => {
    setScanning(false)
    try {
      const res = await apiClient.post('/invitations/scan-qr', {
        qrCode: qrData
      })

      const { guest } = res.data.data
      setMessage({ type: 'success', text: `✓ مرحبا ${guest.fullName}` })
      setCheckedInGuests(prev => [{
        name: guest.fullName,
        chairNumber: guest.chairNumber,
        timestamp: new Date()
      }, ...prev.slice(0, 9)])

      // Emit real-time update
      if (socket) {
        socket.emit('guest-checked-in', {
          guestName: guest.fullName,
          chairNumber: guest.chairNumber,
          eventId,
          timestamp: new Date()
        })
      }

      setTimeout(() => {
        setMessage(null)
        setScanning(true)
      }, 3000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'فشل المسح' })
      setTimeout(() => {
        setMessage(null)
        setScanning(true)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">🚪 ماسح الدخول</h1>
          <p className="text-primary-200">امسح رمز الاستجابة السريعة للدعوة</p>
        </div>

        {/* Scanner */}
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden shadow-2xl mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-green-400 rounded-lg opacity-75 animate-pulse"></div>
          </div>

          {/* Corner Markers */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-white text-center font-bold ${
            message.type === 'success'
              ? 'bg-green-600 shadow-lg animate-bounce'
              : 'bg-red-600 shadow-lg'
          }`}>
            {message.text}
          </div>
        )}

        {/* Recent Check-ins */}
        <div className="bg-white bg-opacity-10 text-white rounded-lg p-4 mb-6 backdrop-blur">
          <h2 className="text-lg font-bold mb-3">آخر الحضور</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {checkedInGuests.length > 0 ? (
              checkedInGuests.map((guest, idx) => (
                <div key={idx} className="bg-green-600 bg-opacity-30 p-2 rounded text-sm">
                  <p className="font-semibold">✓ {guest.name}</p>
                  <p className="text-xs text-green-100">المقعد: {guest.chairNumber || 'غير محدد'} • {guest.timestamp.toLocaleTimeString('ar-SA')}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-primary-200 text-sm">جاري انتظار المسح...</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center text-primary-200 text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              scanning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`}></div>
            <span>{scanning ? 'ماسح نشط' : 'معالجة...'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}