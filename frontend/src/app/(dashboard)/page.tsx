'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/auth'
import apiClient from '@/lib/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const { socket, isConnected } = useSocket()
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeGuests: 0,
    totalVips: 0,
    dispatchedInvitations: 0,
    pendingRequests: 0,
    checkedInToday: 0,
    attendanceRate: 0,
  })
  const [liveCheckIns, setLiveCheckIns] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const eventsRes = await apiClient.get('/events')
        const events = eventsRes.data.data || []
        
        setStats(prev => ({
          ...prev,
          totalEvents: events.length,
          activeGuests: events.reduce((sum: number, e: any) => sum + e.guests.length, 0),
          totalVips: events.reduce((sum: number, e: any) => sum + e.guests.filter((g: any) => g.isVip).length, 0),
          dispatchedInvitations: events.reduce((sum: number, e: any) => sum + e.invitations.length, 0),
        }))
        
        // Generate chart data
        const data = events.map((e: any) => ({
          name: e.title.substring(0, 10),
          guests: e.guests.length,
          checkedIn: e.checkIns.length,
        }))
        setChartData(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Listen for real-time check-ins
  useEffect(() => {
    if (!socket) return

    socket.on('guest-checked-in-live', (data) => {
      setLiveCheckIns(prev => [{
        guestName: data.guestName,
        chairNumber: data.chairNumber,
        timestamp: new Date(data.timestamp),
        eventId: data.eventId
      }, ...prev.slice(0, 9)])

      setStats(prev => ({
        ...prev,
        checkedInToday: prev.checkedInToday + 1,
      }))
    })

    socket.on('stats-updated', (data) => {
      setStats(prev => ({ ...prev, ...data }))
    })

    return () => {
      socket.off('guest-checked-in-live')
      socket.off('stats-updated')
    }
  }, [socket])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-700 via-primary-800 to-primary-900 text-white py-12 px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-2 flex items-center justify-center gap-3">
            <span className="text-6xl">🏛️</span>
            إدارة العلاقات العامة والمراسم
          </h1>
          <p className="text-center text-primary-100 text-lg">وزارة التضامن الاجتماعي</p>
          <p className="text-center text-accent-300 mt-2 text-sm">
            {isConnected ? '✓ متصل' : '✗ غير متصل'} • مرحبا {user?.fullName}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-primary-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">الفاعليات</p>
                <p className="text-4xl font-bold text-primary-700">{stats.totalEvents}</p>
              </div>
              <span className="text-4xl">📅</span>
            </div>
          </div>

          {/* Active Guests */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-accent-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">المدعويون</p>
                <p className="text-4xl font-bold text-accent-600">{stats.activeGuests}</p>
              </div>
              <span className="text-4xl">👥</span>
            </div>
          </div>

          {/* VIPs */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">VIPs</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.totalVips}</p>
              </div>
              <span className="text-4xl">👑</span>
            </div>
          </div>

          {/* Invitations */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">الدعوات</p>
                <p className="text-4xl font-bold text-blue-600">{stats.dispatchedInvitations}</p>
              </div>
              <span className="text-4xl">📧</span>
            </div>
          </div>

          {/* Checked In */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">الحضور اليوم</p>
                <p className="text-4xl font-bold text-green-600">{stats.checkedInToday}</p>
              </div>
              <span className="text-4xl">✓</span>
            </div>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-semibold mb-1">الطلبات المعلقة</p>
                <p className="text-4xl font-bold text-red-600">{stats.pendingRequests}</p>
              </div>
              <span className="text-4xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Line Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-primary-700 mb-4">المدعويون مقابل الحضور</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="guests" stroke="#1E3A8A" strokeWidth={2} name="المدعويون" />
                <Line type="monotone" dataKey="checkedIn" stroke="#22c55e" strokeWidth={2} name="الحضور" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-primary-700 mb-4">إحصائيات الفاعليات</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="guests" fill="#1E3A8A" name="الإجمالي" />
                <Bar dataKey="checkedIn" fill="#D4AF37" name="الحضور" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Check-in Tracker */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-green-500">
          <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
            لوحة تتبع الحضور المباشر
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {liveCheckIns.length > 0 ? (
              liveCheckIns.map((checkIn, idx) => (
                <div key={idx} className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-lg hover:shadow-md transition">
                  <p className="text-green-800 font-bold text-lg">✓ وصل: {checkIn.guestName}</p>
                  <div className="flex justify-between mt-2 text-sm text-green-600">
                    <span>المقعد: {checkIn.chairNumber || 'غير محدد'}</span>
                    <span>{checkIn.timestamp.toLocaleTimeString('ar-SA')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p className="text-lg">جاري انتظار الحضور...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}