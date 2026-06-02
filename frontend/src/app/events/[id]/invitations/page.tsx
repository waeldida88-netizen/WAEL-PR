'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'
import { useSocket } from '@/lib/socket'
import QRCode from 'qrcode.react'

interface Guest {
  id: string
  fullName: string
  jobTitle: string
  organization: string
  email: string
  phoneNumber: string
  isVip: boolean
}

interface Invitation {
  id: string
  guest: Guest
  qrCodeData: string
  status: string
  sentAt?: string
}

export default function InvitationsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<string[]>([])
  const [invitationText, setInvitationText] = useState('')
  const [previewInvitation, setPreviewInvitation] = useState<Invitation | null>(null)
  const { socket } = useSocket()

  useEffect(() => {
    fetchData()
  }, [eventId])

  useEffect(() => {
    if (!socket) return

    socket.on('invitations-generated', (data) => {
      if (data.eventId === eventId) {
        fetchData()
      }
    })

    return () => {
      socket.off('invitations-generated')
    }
  }, [socket, eventId])

  const fetchData = async () => {
    try {
      const guestsRes = await apiClient.get(`/guests?eventId=${eventId}`)
      setGuests(guestsRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvitations = async () => {
    if (selectedGuests.length === 0) {
      alert('يرجى اختيار مدعويين')
      return
    }

    try {
      const res = await apiClient.post('/invitations/generate', {
        eventId,
        guestIds: selectedGuests,
        invitationText
      })
      setInvitations(res.data.data || [])
      setShowGenerateModal(false)
      setSelectedGuests([])
    } catch (error) {
      console.error('Failed to generate invitations:', error)
    }
  }

  const handleSendInvitations = async () => {
    try {
      await apiClient.post('/invitations/send', {
        invitationIds: invitations.map(i => i.id)
      })
      fetchData()
      alert('تم إرسال الدعوات بنجاح')
    } catch (error) {
      console.error('Failed to send invitations:', error)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-primary-700 mb-8">إدارة الدعوات والرموز</h1>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            إنشاء دعوات
          </button>
          {invitations.length > 0 && (
            <button
              onClick={handleSendInvitations}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              إرسال جميع الدعوات
            </button>
          )}
        </div>

        {/* Invitations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map(invitation => (
            <div
              key={invitation.id}
              onClick={() => setPreviewInvitation(invitation)}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition transform hover:scale-105"
            >
              {/* Invitation Card Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 text-center">
                <p className="text-lg font-bold">🏛️ وزارة التضامن الاجتماعي</p>
                <p className="text-sm text-primary-100">الإدارة العامة للعلاقات العامة والمراسم</p>
              </div>

              {/* Guest Info */}
              <div className="p-6 text-center border-b">
                <p className="text-2xl font-bold text-primary-700 mb-2">{invitation.guest.fullName}</p>
                <p className="text-sm text-gray-600">{invitation.guest.jobTitle}</p>
                <p className="text-sm text-gray-500">{invitation.guest.organization}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center p-6 bg-gray-50">
                <div className="bg-white p-3 rounded-lg border-2 border-primary-200">
                  <QRCode
                    value={invitation.qrCodeData}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="p-4 text-center border-t">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  invitation.status === 'SENT' ? 'bg-green-100 text-green-700' :
                  invitation.status === 'READY_TO_SEND' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {invitation.status === 'SENT' ? 'مُرسلة ✓' :
                   invitation.status === 'READY_TO_SEND' ? 'جاهزة للإرسال' : 'مسودة'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Generate Invitations Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold text-primary-700 mb-6">إنشاء دعوات</h2>

              {/* Invitation Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">نص الدعوة</label>
                <textarea
                  value={invitationText}
                  onChange={(e) => setInvitationText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="أدخل نص الدعوة الذي سيظهر في جميع الدعوات"
                  rows={4}
                />
              </div>

              {/* Guest Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">اختر المدعويين</label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {guests.map(guest => (
                    <label key={guest.id} className="flex items-center cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedGuests.includes(guest.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGuests([...selectedGuests, guest.id])
                          } else {
                            setSelectedGuests(selectedGuests.filter(id => id !== guest.id))
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div className="mr-3 flex-1">
                        <p className="font-semibold text-gray-700">{guest.fullName}</p>
                        <p className="text-sm text-gray-500">{guest.jobTitle} • {guest.organization}</p>
                      </div>
                      {guest.isVip && <span className="text-lg">👑</span>}
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">تم اختيار: {selectedGuests.length} من {guests.length}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleGenerateInvitations}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  إنشاء دعوات
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewInvitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
              {/* Invitation Preview */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 text-center rounded-t-lg">
                <p className="text-2xl font-bold">🏛️</p>
                <p className="text-lg font-bold mt-2">وزارة التضامن الاجتماعي</p>
                <p className="text-sm text-primary-100">الإدارة العامة للعلاقات العامة والمراسم</p>
              </div>

              <div className="p-8 text-center">
                <p className="text-2xl font-bold text-primary-700 mb-4">دعوة شرف</p>
                <p className="text-lg font-bold text-gray-800 mb-6">{previewInvitation.guest.fullName}</p>
                <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                  {invitationText || 'يُرجى حضور فاعليتنا الخاصة'}
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <QRCode
                    value={previewInvitation.qrCodeData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 mb-2">امسح الرمز للدخول</p>
              </div>

              <div className="flex gap-4 p-6 border-t">
                <button
                  onClick={() => {
                    const element = document.getElementById('invitation-preview')
                    if (element) {
                      const canvas = element.querySelector('canvas')
                      if (canvas) {
                        const link = document.createElement('a')
                        link.href = canvas.toDataURL('image/png')
                        link.download = `invitation-${previewInvitation.guest.fullName}.png`
                        link.click()
                      }
                    }
                  }}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  تحميل
                </button>
                <button
                  onClick={() => setPreviewInvitation(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}