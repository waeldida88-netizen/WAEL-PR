import React from 'react'

interface NavbarProps {
  user?: {
    fullName: string
    role: string
  }
  onLogout?: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <p className="font-bold">إدارة العلاقات العامة والمراسم</p>
            <p className="text-xs text-primary-200">وزارة التضامن الاجتماعي</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm">
            <p className="font-semibold">{user?.fullName}</p>
            <p className="text-primary-200 text-xs">{user?.role === 'SUPER_ADMIN' ? 'مسؤول' : user?.role === 'ADMIN' ? 'مدير' : 'منسق'}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            تسجيل خروج
          </button>
        </div>
      </div>
    </nav>
  )
}

export function Sidebar() {
  const menuItems = [
    { icon: '📊', label: 'لوحة التحكم', href: '/' },
    { icon: '📅', label: 'الفاعليات', href: '/events' },
    { icon: '👥', label: 'المدعويون', href: '/guests' },
    { icon: '🎫', label: 'الدعوات', href: '/invitations' },
    { icon: '🪑', label: 'خريطة الجلوس', href: '/seating' },
    { icon: '🏛️', label: 'قيادات الوزارة', href: '/ministry-leaders' },
    { icon: '👨‍💼', label: 'الفريق', href: '/team' },
    { icon: '⚙️', label: 'الإعدادات', href: '/settings' },
  ]

  return (
    <aside className="w-64 bg-primary-800 text-white p-6 min-h-screen">
      <div className="space-y-4">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}