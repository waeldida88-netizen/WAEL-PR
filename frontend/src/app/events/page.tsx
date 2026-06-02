'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'
import { useSocket } from '@/lib/socket'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  venueName: string
  eventDate: string
  eventTime: string
  status: string
  layoutType: string
  totalCapacity: number
  guests: any[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    venueName: '',
    eventDate: '',
    eventTime: '',
    totalCapacity: '',
    layoutType: 'THEATER',
    description: ''
  })
  const { socket } = useSocket()

  useEffect(() => {
    fetchEvents()
  }, [])

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return

    socket.on('event-created', (event: Event) => {
      setEvents(prev => [event, ...prev])
    })

    socket.on('event-updated', (event: Event) => {
      setEvents(prev => prev.map(e => e.id === event.id ? event : e))
    })

    socket.on('event-deleted', (data: { id: string }) => {
      setEvents(prev => prev.filter(e => e.id !== data.id))
    })

    return () => {
      socket.off('event-created')
      socket.off('event-updated')
      socket.off('event-deleted')
    }
  }, [socket])

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get('/events')
      setEvents(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/events', formData)
      setShowModal(false)
      setFormData({
        title: '',
        venueName: '',
        eventDate: '',
        eventTime: '',
        totalCapacity: '',
        layoutType: 'THEATER',
        description: ''
      })
      fetchEvents()
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700">إدارة الفاعليات</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + إضافة فاعلية
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer transform hover:scale-105">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4">
                  <h3 className="text-xl font-bold">{event.title}</h3>
                  <p className="text-primary-100 text-sm mt-1">{event.venueName}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">📅 التاريخ:</span>
                    <span className="font-semibold">{new Date(event.eventDate).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">⏰ الوقت:</span>
                    <span className="font-semibold">{event.eventTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">🪑 الطاقة:</span>
                    <span className="font-semibold">{event.totalCapacity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">👥 المدعويون:</span>
                    <span className="font-semibold text-primary-600">{event.guests.length}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                      event.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                      event.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status === 'DRAFT' ? 'مسودة' :
                       event.status === 'SCHEDULED' ? 'مجدولة' :
                       event.status === 'IN_PROGRESS' ? 'جارية' : 'منتهية'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">إضافة فاعلية جديدة</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">اسم الفاعلية</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="مثال: حفل تكريم العاملين"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">اسم الفندق/المقر</label>
                <input
                  type="text"
                  required
                  value={formData.venueName}
                  onChange={(e) => setFormData({...formData, venueName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="مثال: فندق الريتز كارلتون"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الوقت</label>
                <input
                  type="time"
                  required
                  value={formData.eventTime}
                  onChange={(e) => setFormData({...formData, eventTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">السعة</label>
                <input
                  type="number"
                  required
                  value={formData.totalCapacity}
                  onChange={(e) => setFormData({...formData, totalCapacity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="عدد المقاعد"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">نوع التخطيط</label>
                <select
                  value={formData.layoutType}
                  onChange={(e) => setFormData({...formData, layoutType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="THEATER">مسرح</option>
                  <option value="ROUND_TABLES">طاولات مستديرة</option>
                  <option value="PLATFORM_ROWS">منصة وصفوف</option>
                  <option value="SEPARATE_TABLES">طاولات منفصلة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                  placeholder="وصف الفاعلية"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  إنشاء
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}