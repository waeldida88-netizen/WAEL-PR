'use client'

import React from 'react'
import SeatingEditor from '@/components/SeatingEditor'

export default function EventSeatingPage({ params }: any) {
  const { id } = params
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">محرر المقاعد للفعالية</h2>
      <SeatingEditor eventId={id} />
    </div>
  )
}
