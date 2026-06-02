'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'

interface PendingUser {
  id: string
  email: string
  fullName: string
  phoneNumber: string
  createdAt: string
}

export default function TeamPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    // Check if user is SUPER_ADMIN
    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/events')
      return
    }
    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const [pendingRes, membersRes] = await Promise.all([
        apiClient.get('/team/pending-requests'),
        apiClient.get('/team/members')
      ])
      setPendingUsers(pendingRes.data.data || [])
      setTeamMembers(membersRes.data.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      await apiClient.post(`/team/approve-user/${userId}`)
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      fetchData()
    } catch (error) {
      console.error('Failed to approve user:', error)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      await apiClient.post(`/team/reject-user/${userId}`)
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
    } catch (error) {
      console.error('Failed to reject user:', error)
    }
  }

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/events" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">← العودة</Link>
          <h1 className="text-4xl font-bold text-primary-700">إدارة الفريق</h1>
          <p className="text-gray-600 mt-2">⚙️ متاح فقط للمسؤول الأساسي</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:shadow-lg'
            }`}
          >
            طلبات الانضمام ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'members'
                ? 'bg-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:shadow-lg'
            }`}
          >
            أعضاء الفريق ({teamMembers.length})
          </button>
        </div>

        {/* Pending Requests */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingUsers.length > 0 ? (
              pendingUsers.map(user => (
                <div key={user.id} className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{user.fullName}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      طلب التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveUser(user.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      ✓ الموافقة
                    </button>
                    <button
                      onClick={() => handleRejectUser(user.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      ✕ الرفض
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-600">
                <p className="text-lg">لا توجد طلبات انضمام معلقة</p>
              </div>
            )}
          </div>
        )}

        {/* Team Members */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-primary-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-right">الاسم</th>
                  <th className="px-6 py-4 text-right">البريد الإلكتروني</th>
                  <th className="px-6 py-4 text-right">الدور</th>
                  <th className="px-6 py-4 text-right">الحالة</th>
                  <th className="px-6 py-4 text-right">الصلاحيات</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, idx) => (
                  <tr key={member.id} className={`border-b ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 font-semibold text-gray-800">{member.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {member.role === 'SUPER_ADMIN' ? 'مسؤول' :
                         member.role === 'ADMIN' ? 'مدير' :
                         member.role === 'COORDINATOR' ? 'منسق' : 'عارض'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        member.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {member.permissions?.canManageEvents && <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">إدارة</span>}
                        {member.permissions?.canEditSeating && <span className="bg-accent-100 text-accent-700 px-2 py-1 rounded text-xs">جلوس</span>}
                        {member.permissions?.canSendInvitations && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">دعوات</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}