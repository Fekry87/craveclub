# SwimClub Platform

Multi-tenant Swim Club Management System with role-based dashboards for platform admins, club managers, coaches, and swimmers.

## Tech Stack

- **Backend**: PHP 8.2 + Laravel 12 + Sanctum SPA Auth + SQLite
- **Frontend**: React 18 + Vite + React Router + Axios

## Quick Start

### Prerequisites

- PHP 8.2+ with SQLite extension
- Composer
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
cp .env.example .env        # Already configured for SQLite
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve            # Runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
```

### Open in Browser

Navigate to **http://localhost:5173** to access the application.

## Demo Credentials

| Role            | Email                      | Password      |
|-----------------|----------------------------|---------------|
| Platform Admin  | admin@platform.com         | Password123!  |
| Club Manager    | manager@aquasharks.com     | Password123!  |
| Coach           | coach1@aquasharks.com      | Password123!  |
| Swimmer         | swimmer1@aquasharks.com    | Password123!  |

## Project Structure

```
/backend                 Laravel API
  /app
    /Enums               UserRole, SkillType
    /Http/Controllers    Auth, Platform, Club, Coach, Swimmer, Public
    /Http/Middleware      RoleMiddleware, ClubContext
    /Models              16 Eloquent models
    /Traits              BelongsToClub, Auditable
  /database
    /migrations          20 migration files
    /seeders             DemoSeeder with full sample data
  /routes/api.php        All API routes

/frontend               React SPA
  /src
    /api                 Axios instance with Sanctum CSRF
    /contexts            AuthContext (login/logout/me)
    /components          Layout, ProtectedRoute, CrudTable
    /pages
      /platform          Dashboard, Clubs
      /club              Dashboard, Plans, Skills, Coaches, Swimmers, Groups, Sessions, Settings
      /coach             Dashboard, Groups, DailyTraining
      /swimmer           Dashboard, Sessions, Evaluations, Stats
      /public            ClubPage
```

## Seed Data

- **1 Club**: Aqua Sharks (slug: `aqua-sharks`)
- **2 Coaches**: Ahmed (Freestyle/Butterfly), Sara (Backstroke/IM)
- **10 Swimmers**: 5 per group, 1 with login
- **2 Groups**: Sharks Elite, Dolphins Rising
- **2 Training Plans**: Sprint Power Session, Endurance Builder (each with 4 items)
- **8 Skills**: 4 swim types, 2 techniques, 2 skills
- **10 Training Sessions**: Mon-Fri for both groups

## Manual Test Checklist

1. Login as `admin@platform.com` - see Platform Dashboard with metrics
2. Navigate to Platform > Clubs - see Aqua Sharks, create/edit/delete clubs
3. Logout, login as `manager@aquasharks.com` - see Club Dashboard
4. Navigate through Plans, Skills, Coaches, Swimmers, Groups, Sessions
5. Create/edit/delete items in each CRUD page
6. Check Settings page for club branding
7. Logout, login as `coach1@aquasharks.com` - see Coach Dashboard
8. View assigned groups and their swimmers
9. Submit a daily training record with attendance and evaluations
10. Logout, login as `swimmer1@aquasharks.com` - see Swimmer Dashboard
11. View sessions, evaluations, and stats
12. Visit public page: http://localhost:5173/clubs/aqua-sharks

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Platform Admin
- `GET /api/platform/metrics` - Dashboard metrics
- `GET|POST /api/platform/clubs` - List/Create clubs
- `GET|PUT|DELETE /api/platform/clubs/{id}` - Show/Update/Delete club

### Club Manager
- `GET /api/club/dashboard` - Dashboard stats
- `GET|PUT /api/club/settings` - Club settings
- CRUD: `/api/club/plans`, `/api/club/skills`, `/api/club/coaches`, `/api/club/swimmers`, `/api/club/groups`, `/api/club/sessions`
- `POST /api/club/groups/{id}/members` - Assign group members

### Coach
- `GET /api/coach/dashboard` - Coach dashboard
- `GET /api/coach/groups` - Assigned groups
- `POST /api/coach/daily-training` - Submit daily training

### Swimmer
- `GET /api/swimmer/dashboard` - Swimmer dashboard
- `GET /api/swimmer/sessions` - Training sessions
- `GET /api/swimmer/evaluations` - Evaluations received
- `GET /api/swimmer/stats` - Performance stats

### Public
- `GET /api/clubs/{slug}` - Public club info
