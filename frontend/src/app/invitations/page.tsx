'use client'

import React, { useEffect, useState } from 'react'
import api from '@/lib/api'
import InvitationCard from '@/components/InvitationCard'

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/invitations')
      setInvitations(res.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">الدعوات</h2>

      {loading ? (
        <div>جار التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {invitations.map((inv) => (
            <InvitationCard key={inv.id} invitation={inv} />
          ))}
        </div>
      )}
    </div>
  )
}
