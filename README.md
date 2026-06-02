# 🏛️ Enterprise Event Management & Protocol System
## وزارة التضامن الاجتماعي - الإدارة العامة للعلاقات العامة والمراسم

A comprehensive, production-ready, highly secure Enterprise Event Management and Protocol System with real-time multi-user collaboration, WebSocket synchronization, and advanced 3D seating visualization.

---

## 📋 Core Features

### 1. **Central Dashboard (لوحة المعلومات)**
- Real-time metrics & analytics
- Live attendance tracking with QR code integration
- Dynamic guest arrival feed
- Professional Royal Blue & Gold executive theme

### 2. **Ministry Leadership Database (قيادات الوزارة)**
- Dedicated CRM for VIPs
- Complete CRUD operations
- Profile pictures & detailed records
- Seamless integration with invitations & seating

### 3. **Event Management & Scheduling (الفاعليات)**
- Fluid event creation interface
- Luxury venue backgrounds
- Layout template system (Theater, Round Tables, Platform & Rows, Separate Tables)
- Reusable venue templates for future events

### 4. **Guest List Management (قائمة الحضور)**
- Comprehensive attendee directory
- Full registry with job titles, organizations, contact info
- Real-time synchronization across team

### 5. **3D Seating Chart Editor & Simulator (محرر المقاعد)**
- Advanced visual canvas with drag-and-drop
- Multiple layout archetypes with dynamic simulation
- Protocol conflict alerts
- Smart guest assignment from integrated databases
- High-resolution vector PDF export (A0/A1 quality)

### 6. **Dynamic Invitations & QR Code System (الدعوات)**
- Professional invitation templates with official branding
- Unique QR codes per guest
- Mobile-optimized scanner for door check-in
- Bulk distribution via Email & WhatsApp Business API

### 7. **Team & Permissions Management (فريق العمل)**
- Developer-only access for team management
- Sign-up approval pipeline
- Role-Based Access Control (RBAC)
- Granular permission assignment

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui Components
- **3D Graphics**: Three.js + React Three Fiber
- **Real-time**: Socket.io Client
- **Charts**: Recharts / Chart.js
- **PDF Export**: jsPDF + html2canvas + jspdf-vector-export

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Real-time**: Socket.io Server
- **Authentication**: JWT + bcrypt
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod / Joi
- **Email**: SendGrid API
- **WhatsApp**: Meta WhatsApp Business API

### Infrastructure
- **Docker**: Containerized deployment
- **Database**: PostgreSQL 15+
- **Cache**: Redis (for real-time sync optimization)
- **API Documentation**: Swagger/OpenAPI

---

## 📁 Project Structure

```
event-management-system/
├── frontend/                    # Next.js React App
│   ├── app/
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Main dashboard layout
│   │   ├── events/             # Event management
│   │   ├── guests/             # Guest list management
│   │   ├── seating/            # 3D seating editor
│   │   ├── invitations/        # Invitation designer & QR
│   │   ├── team/               # Team management
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── seating/            # 3D canvas component
│   │   ├── invitations/
│   │   └── shared/             # Reusable components
│   ├── lib/
│   │   ├── socket-client.ts    # WebSocket client
│   │   ├── auth.ts
│   │   └── api.ts
│   └── styles/                 # Tailwind configuration
│
├── backend/                     # Node.js Express Server
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── controllers/        # Business logic
│   │   ├── services/           # External integrations
│   │   ├── middleware/         # Auth, RBAC
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Validation
│   │   ├── socket/             # WebSocket handlers
│   │   ├── utils/
│   │   └── config/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── docker/
│
├── docker-compose.yml          # Multi-container setup
├── .env.example
└── docs/                        # Documentation
    ├── API.md
    ├── DEPLOYMENT.md
    └── ARCHITECTURE.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/waeldida88-netizen/WAEL-PR.git
cd WAEL-PR
```

2. **Setup Environment**
```bash
cp .env.example .env.local
# Configure database, API keys, etc.
```

3. **Install Dependencies**
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

4. **Database Setup**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Or use Docker Compose:
```bash
docker-compose up -d
```

---

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **bcrypt** password hashing
- **Role-Based Access Control (RBAC)**
- **Request validation** with Zod
- **SQL injection prevention** via Prisma ORM
- **CORS protection**
- **Rate limiting** on sensitive endpoints
- **Secure QR code generation** with encrypted guest data

---

## 📦 API Documentation

See `docs/API.md` for comprehensive endpoint documentation.

### Key Endpoints

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

# Events
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/:id/statistics

# Guests
GET    /api/guests?eventId=...
POST   /api/guests
PUT    /api/guests/:id
DELETE /api/guests/:id
POST   /api/guests/bulk/import

# Ministry Leaders
GET    /api/ministry-leaders
POST   /api/ministry-leaders
PUT    /api/ministry-leaders/:id

# Seating
GET    /api/seating/:eventId
POST   /api/seating/:eventId/assign
POST   /api/seating/:eventId/export-pdf

# Invitations
POST   /api/invitations/generate
POST   /api/invitations/send-bulk
POST   /api/invitations/scan-qr

# Check-in
POST   /api/check-in/qr-scan

# Team Management (Developer Only)
GET    /api/team/pending-requests
POST   /api/team/approve-user/:userId
POST   /api/team/assign-permissions
GET    /api/team/members
```

---

## 🎨 Design System

### Color Palette
- **Primary**: Royal Blue (`#1E3A8A`)
- **Accent**: Gold/Bronze (`#D4AF37`)
- **Background**: Crisp White (`#FFFFFF`)
- **Text**: Dark Slate (`#1F2937`)

### Typography
- **Headers**: Segoe UI / Inter (Bold, 28-48px)
- **Body**: Inter (Regular, 14-16px)
- **Mono**: Fira Code (for technical content)

---

## 📱 Real-Time Synchronization

WebSocket events for live multi-user collaboration:

```javascript
// Event Assignment
socket.on('guest-assigned-to-chair', (data) => {...})

// Live Check-in
socket.on('guest-checked-in', (data) => {...})

// Seating Updates
socket.on('seating-layout-updated', (data) => {...})

// Invitation Status
socket.on('invitation-sent', (data) => {...})
```

---

## 📊 Database Schema

Key entities:
- `User` (with roles & permissions)
- `Event`
- `Guest`
- `MinistryLeader`
- `SeatingLayout`
- `Chair`
- `Invitation`
- `QRCode`
- `TeamRequest`

See `backend/prisma/schema.prisma` for full schema.

---

## 🧪 Testing

```bash
# Run backend tests
cd backend && npm run test

# Run frontend tests
cd frontend && npm run test

# E2E testing
npm run test:e2e
```

---

## 📄 License

Government Project - All Rights Reserved

---

## 👨‍💼 Support & Contributions

For issues, questions, or contributions, please contact the development team.

---

**Built with ❤️ for Government Excellence**