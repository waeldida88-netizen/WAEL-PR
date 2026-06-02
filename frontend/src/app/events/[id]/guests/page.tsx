'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import apiClient from '@/lib/api'
import { useSocket } from '@/lib/socket'

interface Guest {
  id: string
  fullName: string
  jobTitle: string
  organization: string
  email: string
  phoneNumber: string
  isVip: boolean
  status: string
}

export default function GuestsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    organization: '',
    email: '',
    phoneNumber: '',
    isVip: false
  })
  const { socket } = useSocket()

  useEffect(() => {
    fetchGuests()
  }, [eventId])

  useEffect(() => {
    if (!socket) return

    socket.on('guest-added', (data) => {
      if (data.eventId === eventId) {
        setGuests(prev => [data.guest, ...prev])
      }
    })

    socket.on('guest-updated', (guest) => {
      if (guest.eventId === eventId) {
        setGuests(prev => prev.map(g => g.id === guest.id ? guest : g))
      }
    })

    socket.on('guest-deleted', (data) => {
      if (data.eventId === eventId) {
        setGuests(prev => prev.filter(g => g.id !== data.id))
      }
    })

    return () => {
      socket.off('guest-added')
      socket.off('guest-updated')
      socket.off('guest-deleted')
    }
  }, [socket, eventId])

  const fetchGuests = async () => {
    try {
      const res = await apiClient.get(`/guests?eventId=${eventId}`)
      setGuests(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.post('/guests', {
        ...formData,
        eventId
      })
      setShowModal(false)
      setFormData({
        fullName: '',
        jobTitle: '',
        organization: '',
        email: '',
        phoneNumber: '',
        isVip: false
      })
      fetchGuests()
    } catch (error) {
      console.error('Failed to add guest:', error)
    }
  }

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المدعو؟')) return
    try {
      await apiClient.delete(`/guests/${guestId}`)
      fetchGuests()
    } catch (error) {
      console.error('Failed to delete guest:', error)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  const vipCount = guests.filter(g => g.isVip).length
  const regularCount = guests.length - vipCount

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700">المدعويون</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + إضافة مدعو
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">الإجمالي</p>
            <p className="text-3xl font-bold text-primary-700">{guests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">VIPs</p>
            <p className="text-3xl font-bold text-yellow-600">👑 {vipCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600 text-sm">منتظمون</p>
            <p className="text-3xl font-bold text-blue-600">{regularCount}</p>
          </div>
        </div>

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-600 text-white">
              <tr>
                <th className="px-6 py-4 text-right">الاسم</th>
                <th className="px-6 py-4 text-right">المنصب</th>
                <th className="px-6 py-4 text-right">الجهة</th>
                <th className="px-6 py-4 text-right">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right">النوع</th>
                <th className="px-6 py-4 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, idx) => (
                <tr key={guest.id} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-primary-50 transition`}>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800">{guest.fullName}</span>
                    {guest.isVip && <span className="ml-2">👑</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{guest.jobTitle}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{guest.organization}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate">{guest.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      guest.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' :
                      guest.status === 'INVITED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {guest.status === 'CHECKED_IN' ? 'حاضر' : guest.status === 'INVITED' ? 'مدعو' : 'لم يحضر'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">إضافة مدعو جديد</h2>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">المنصب</label>
                <input
                  type="text"
                  required
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الجهة</label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVip"
                  checked={formData.isVip}
                  onChange={(e) => setFormData({...formData, isVip: e.target.checked})}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="isVip" className="mr-2 text-sm font-semibold text-gray-700">VIP 👑</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  إضافة
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