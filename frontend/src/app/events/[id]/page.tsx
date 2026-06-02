'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  venueName: string
  eventDate: string
  eventTime: string
  status: string
  totalCapacity: number
  guests: any[]
  invitations: any[]
  checkIns: any[]
}

export default function EventDetailsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchEventDetails()
  }, [eventId])

  const fetchEventDetails = async () => {
    try {
      const res = await apiClient.get(`/events/${eventId}`)
      setEvent(res.data.data)
    } catch (error) {
      console.error('Failed to fetch event:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>
  if (!event) return <div className="p-8 text-center text-red-600">الفاعلية غير موجودة</div>

  const attendanceRate = event.guests.length > 0 ? ((event.checkIns.length / event.guests.length) * 100).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg p-8 mb-8 shadow-lg">
          <Link href="/events" className="text-primary-100 hover:text-white mb-4 inline-block">← العودة للفاعليات</Link>
          <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-primary-100">📍 {event.venueName} • 📅 {new Date(event.eventDate).toLocaleDateString('ar-SA')} • ⏰ {event.eventTime}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">إجمالي المدعويين</p>
            <p className="text-3xl font-bold text-primary-700">{event.guests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">الحضور</p>
            <p className="text-3xl font-bold text-green-600">{event.checkIns.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">نسبة الحضور</p>
            <p className="text-3xl font-bold text-accent-600">{attendanceRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">الدعوات المُرسلة</p>
            <p className="text-3xl font-bold text-blue-600">{event.invitations.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 font-semibold border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-primary-600'
              }`}
            >
              نظرة عامة
            </button>
            <button
              onClick={() => setActiveTab('guests')}
              className={`flex-1 py-4 px-6 font-semibold border-b-2 transition ${
                activeTab === 'guests'
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-primary-600'
              }`}
            >
              المدعويون
            </button>
            <button
              onClick={() => setActiveTab('seating')}
              className={`flex-1 py-4 px-6 font-semibold border-b-2 transition ${
                activeTab === 'seating'
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-primary-600'
              }`}
            >
              الجلوس
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`flex-1 py-4 px-6 font-semibold border-b-2 transition ${
                activeTab === 'invitations'
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-primary-600'
              }`}
            >
              الدعوات
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">الحالة</p>
                    <p className="font-semibold text-lg">
                      {event.status === 'DRAFT' ? 'مسودة' :
                       event.status === 'SCHEDULED' ? 'مجدولة' :
                       event.status === 'IN_PROGRESS' ? 'جارية' : 'منتهية'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">السعة</p>
                    <p className="font-semibold text-lg">{event.totalCapacity}</p>
                  </div>
                </div>
                <div>
                  <Link
                    href={`/events/${event.id}/seating`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
                  >
                    تحرير التخطيط
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'guests' && (
              <div>
                <div className="mb-4">
                  <Link
                    href={`/events/${event.id}/guests`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    إدارة المدعويين
                  </Link>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {event.guests.map(guest => (
                    <div key={guest.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{guest.fullName}</p>
                        <p className="text-sm text-gray-600">{guest.jobTitle} • {guest.organization}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        guest.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' :
                        guest.status === 'INVITED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {guest.status === 'CHECKED_IN' ? 'حاضر' : guest.status === 'INVITED' ? 'مدعو' : 'لم يحضر'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'seating' && (
              <div>
                <Link
                  href={`/events/${event.id}/seating`}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  تحرير خريطة الجلوس
                </Link>
              </div>
            )}

            {activeTab === 'invitations' && (
              <div>
                <Link
                  href={`/events/${event.id}/invitations`}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  إنشاء وإرسال دعوات
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}