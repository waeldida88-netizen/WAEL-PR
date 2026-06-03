'use client'

import React, { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
        requestAnimationFrame(tick)
      }
    } catch (err) {
      console.error('Camera error', err)
      setMessage('لا يمكن الوصول إلى الكاميرا')
    }
  }

  const stopCamera = () => {
    setScanning(false)
    const stream = videoRef.current?.srcObject as MediaStream | undefined
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const tick = () => {
    if (!scanning) return
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      const ctx = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
      if (imageData) {
        const code = jsQR(imageData.data, canvas.width, canvas.height)
        if (code) {
          // code.data should be the short code we encoded
          handleScannedCode(code.data)
          return
        }
      }
    }
    requestAnimationFrame(tick)
  }

  const handleScannedCode = async (code: string) => {
    setMessage('جارٍ التحقق...')
    stopCamera()
    try {
      const res = await api.post('/invitations/scan-qr', { qrCode: code })
      setMessage('تم تسجيل وصول: ' + res.data.data.guest.fullName)
    } catch (err: any) {
      console.error(err)
      setMessage(err?.response?.data?.error?.message || 'فشل الفحص')
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">ماسح الدعوات - واجهة الهاتف</h2>
      <div className="relative rounded overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-auto" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-4">
        <p className="text-lg">{message}</p>
        <div className="mt-2">
          <button className="px-4 py-2 bg-primary-600 text-white rounded" onClick={() => { setMessage(null); startCamera() }}>إعادة المحاولة</button>
        </div>
      </div>
    </div>
  )
}
