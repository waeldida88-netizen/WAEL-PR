import React from 'react'

export default function InvitationCard({ invitation }: { invitation: any }) {
  return (
    <div className="max-w-xl mx-auto bg-white border rounded-lg shadow-md p-6">
      <div className="text-center">
        <img src="/ministry-logo.png" alt="Ministry Logo" className="mx-auto h-20" />
        <h3 className="text-xl font-bold mt-3">وزارة التضامن الاجتماعي</h3>
        <p className="text-sm text-gray-600">الإدارة العامة للعلاقات العامة والمراسم</p>
      </div>

      <hr className="my-4" />

      <div className="prose max-w-none text-right" dangerouslySetInnerHTML={{ __html: invitation.invitationText || '<p>نص الدعوة هنا</p>' }} />

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <p>الفعالية: {invitation.event?.title || '—'}</p>
          <p>التاريخ: {invitation.event?.eventDate ? new Date(invitation.event.eventDate).toLocaleString() : '—'}</p>
          <p>اسم المدعو: {invitation.guest?.fullName || '—'}</p>
        </div>

        <div className="w-40 h-40 bg-white p-2 border rounded flex items-center justify-center">
          {invitation.qrCodeData ? (
            // qrCodeData is a data URL (image)
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invitation.qrCodeData} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="text-xs text-gray-400">لا يوجد رمز QR</div>
          )}
        </div>
      </div>

      <div className="mt-4 text-right text-xs text-gray-400">وزارة التضامن الاجتماعي - الإدارة العامة للعلاقات العامة والمراسم</div>
    </div>
  )
}
