'use client'

import React, { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import api from '@/lib/api'

export default function InvitationDesigner() {
  const [html, setHtml] = useState('<p>أهلًا بك في دعوتنا الرسمية.</p>')
  const editorRef = useRef<HTMLDivElement | null>(null)

  const saveTemplate = async () => {
    // Save as a template or draft - placeholder for API call
    try {
      // Example: POST /api/invitations/template
      alert('تم حفظ القالب (نموذجي)')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">مُنشئ الدعوة</h2>

      <div className="mb-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[200px] border p-4 rounded prose"
          onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-primary-600 text-white rounded" onClick={saveTemplate}>حفظ القالب</button>
        <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => { setHtml('<p>أهلًا بك في دعوتنا الرسمية.</p>') }}>استعادة الافتراضي</button>
      </div>
    </div>
  )
}
