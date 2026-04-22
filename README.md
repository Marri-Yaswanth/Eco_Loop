# EcoLoop

**Complete Waste Management Platform**

A modern, full-stack waste management system built with Next.js 15, Supabase, TypeScript, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

EcoLoop is a comprehensive waste management platform connecting users with waste collection services. Features include real-time tracking, role-based access control, collection management, and analytics dashboards.

### Live Demo: [https://eco-loop-ky34lr3t8-yaswanths-projects-94e617d9.vercel.app/]

## Key Features

### User Features
- Submit waste collection requests with saved addresses
- Real-time collection status tracking
- View assigned vehicle and driver details
- Manage multiple addresses
- Collection history with filters
- Profile management with statistics
- Expected pickup time display

### Admin Features
- ATnalytics dashboard with interactive charts
- Approve/reject collection requests
- Vehicle fleet management (CRUD)
- Driver management (CRUD)
- Collection assignment (vehicle + driver)
- Collection status updates (scheduled → in progress → completed)
- Waste category management
- Visual analytics (pie, bar, and line charts)

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15.5.7 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Styling** | Tailwind CSS |
| **UI Components** | shadcn/ui |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ecoloop.git
cd ecoloop

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your Supabase URL and anon key to .env.local

# Run database migrations
# Copy content from supabase-schema.sql and run in Supabase SQL Editor

# (Optional) Seed mock data
# Copy content from seed-mock-data.sql and run in Supabase SQL Editor

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Default Credentials

### Admin Account
```
Email: admin@ecoloop.com
Password: admin123
```

### Test User Account
```
Email: user1@ecoloop.com
Password: 123user1
```

## Database Schema

9 core tables with Row Level Security (RLS):
- **profiles** - User profiles with roles
- **user_addresses** - Multiple addresses per user
- **waste_requests** - Collection requests
- **collections** - Assigned collections with status tracking
- **vehicles** - Vehicle fleet management
- **drivers** - Driver information
- **transportations** - Transportation tracking
- **waste_categories** - Waste type classifications
- **segregations** - Segregation records

## Project Structure

```
ecoloop/
├── app/
│   ├── (auth)/              # Login, Register
│   ├── dashboard/           # User Dashboard
│   ├── collections/         # Collection Management
│   ├── addresses/           # Address Management
│   ├── profile/             # User Profile
│   └── admin/               # Admin Pages
│       ├── dashboard/       # Admin Dashboard with Charts
│       ├── requests/        # Request Management
│       ├── collections/     # Collection Status Updates
│       ├── vehicles/        # Vehicle Management
│       ├── drivers/         # Driver Management
│       └── categories/      # Category Management
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── dashboard/           # Dashboard components
├── lib/
│   ├── supabase/            # Supabase clients
│   └── auth.ts              # Auth utilities
└── types/                   # TypeScript types
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click Deploy

3. **Post-Deployment**
   - Run database migrations in Supabase
   - Create admin user
   - (Optional) Seed mock data

## Features Showcase

### User Dashboard
- Real-time statistics
- Recent collection requests
- Quick action cards
- Saved address selection

### Admin Dashboard
- Interactive charts (Pie, Bar, Line)
- Real-time analytics
- Quick navigation cards
- Recent requests feed

### Collection Management
- Status tracking (scheduled → in progress → completed)
- Vehicle and driver assignment
- Actual pickup time recording
- Completion time tracking

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Status

**Status:** Production Ready

- Authentication & Authorization
- User Features (100%)
- Admin Features (100%)
- Collection Status Updates
- Analytics Dashboard with Charts
- Real-time Data
- Responsive Design

## Contributing

Contributions, issues, and feature requests are welcome!


## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Recharts](https://recharts.org/) - Charts library

## License

This project is [MIT](LICENSE) licensed.