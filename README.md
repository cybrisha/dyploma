# Authentication System for Critical Infrastructure

A full-stack authentication system prototype built with React (frontend) and Node.js + Express (backend), featuring JWT authentication, role-based access control, audit logging, optional 2FA, and operator password generation.

## Features

- ✅ **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- ✅ **Password Security** - bcrypt password hashing with configurable rounds
- ✅ **Role-Based Access Control** - Admin, Operator, and Viewer roles with hierarchical permissions
- ✅ **Audit Logging** - Comprehensive logging of all security-relevant actions
- ✅ **Brute-Force Protection** - Rate limiting and account locking
- ✅ **Two-Factor Authentication** - Optional TOTP-based 2FA using authenticator apps
- ✅ **User Management** - Admin panel for user CRUD operations
- ✅ **Password Generation** - Operator tools for policy-compliant password generation
- ✅ **Security Best Practices** - OWASP-compliant security measures

## Tech Stack

### Backend
- Node.js + Express 5
- PostgreSQL (Sequelize ORM; SQLite is supported as an optional local dialect)
- JWT (jsonwebtoken)
- bcrypt
- Winston (logging)
- Helmet (security)
- express-rate-limit
- express-validator
- speakeasy + qrcode (2FA)

### Frontend
- React 19
- React Router 7
- Axios
- Context API (state management)
- Vite 8 (build tool)
- ESLint 10

## Project Structure

```
project/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication controllers
│   │   ├── userController.js    # User management controllers
│   │   ├── logController.js     # Log viewing controllers
│   │   └── twoFactorController.js
│   ├── middleware/
│   │   ├── auth.js              # Authentication & authorization
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── logger.js            # Request logging
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Role.js              # Role model
│   │   ├── LogEntry.js          # Audit log model
│   │   ├── TwoFactorConfig.js   # 2FA configuration
│   │   └── index.js             # Model relationships
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── userRoutes.js        # User endpoints
│   │   ├── logRoutes.js         # Log endpoints
│   │   ├── twoFactorRoutes.js   # 2FA endpoints
│   │   └── index.js             # Route aggregator
│   ├── services/
│   │   ├── authService.js       # Authentication logic
│   │   ├── userService.js       # User management logic
│   │   ├── logService.js        # Logging logic
│   │   └── twoFactorService.js  # 2FA logic
│   ├── scripts/
│   │   ├── seed.js              # Database seeding
│   │   └── clearUsers.js        # Remove users and related data
│   ├── __tests__/               # Jest tests
│   ├── logs/                    # Log files (created at runtime)
│   └── server.js                # Express server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Main layout component
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── Logs.jsx
│   │   │   ├── TwoFactorSetup.jsx
│   │   │   └── PasswordGeneration.jsx
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── utils/
│   │   │   └── passwordGenerator.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── eslint.config.js
│   ├── env.example
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── USER_MANUAL.md
│   └── DEVELOPER.md
├── create_db.sql
├── jest.config.js
├── package.json                 # Root / backend package.json
├── setup-env.ps1
├── SETUP_WINDOWS.md
├── QUICKSTART.md
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js **20.19+** (22.12+ and 24 are also supported; required by Vite 8 / ESLint 10)
- PostgreSQL 12 or higher (default database)
- npm

### 1. Clone and Install Dependencies

```bash
# Install root (backend) dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Database Setup

**PostgreSQL (default)**

1. Create the database (pgAdmin, `psql`, or `create_db.sql`):

```sql
CREATE DATABASE auth_system_db;
```

2. Put credentials in a `.env` file in the **project root** (npm scripts load env from the working directory).

**Optional SQLite (local/dev without PostgreSQL)**

```env
DB_DIALECT=sqlite
DB_STORAGE=./backend/dev.sqlite
```

Install the SQLite driver first (`npm install sqlite3`). Sequelize maps 2FA backup codes to JSON on non-Postgres dialects.

### 3. Configure Environment Variables

Create `.env` in the project root. On Windows you can run `.\setup-env.ps1` to generate `backend/.env` and `frontend/.env`; copy the backend values into the root `.env` as well so `npm run dev` / `npm run seed` pick them up.

**Backend** (project root `.env`):

```env
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_system_db
DB_USER=postgres
DB_PASSWORD=your_password
# Optional: sqlite instead of postgres
# DB_DIALECT=sqlite
# DB_STORAGE=./backend/dev.sqlite

JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12
LOGIN_ATTEMPT_LIMIT=5
LOGIN_WINDOW_MS=600000
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`, template: `frontend/env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Database

```bash
npm run seed
```

This creates default users:

- **Admin**: login=`admin`, password=`Admin123!`
- **Operator**: login=`operator`, password=`Operator123!`
- **Viewer**: login=`viewer`, password=`Viewer123!`

To wipe users and related 2FA/log rows:

```bash
npm run clear-users
```

### 5. Run the Application

**Development mode** (backend + frontend):

```bash
npm run dev
```

**Or run separately:**

```bash
npm run dev:server
```

```bash
cd frontend
npm run dev
```

**Production-style backend start:**

```bash
npm start
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

## API Endpoints

### Health
- `GET /health` - Process health (no auth)

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-2fa` - Complete login with TOTP when 2FA is enabled
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID (admin)
- `POST /api/users` - Create user (admin)
- `PATCH /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `POST /api/users/change-password` - Change own password (authenticated)

### Logs (Admin only)
- `GET /api/logs` - Get audit logs

### 2FA (Authenticated)
- `GET /api/2fa/status` - 2FA status for current user
- `GET /api/2fa/generate` - Generate 2FA secret and QR code
- `POST /api/2fa/enable` - Enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

## Security Features

1. **Password Hashing**: bcrypt with 12 rounds (configurable)
2. **JWT Tokens**: Short-lived access tokens (15min) + refresh tokens (7 days)
3. **HttpOnly Cookies**: Tokens stored in httpOnly cookies (with localStorage fallback)
4. **Rate Limiting**: Login attempts limited to 5 per 10 minutes; general API limiter on `/api`
5. **Account Locking**: Automatic locking after failed attempts
6. **Input Validation**: express-validator for request validation
7. **SQL Injection Protection**: Sequelize ORM with parameterized queries
8. **XSS Protection**: Helmet.js security headers
9. **CORS**: Production allows only `FRONTEND_URL`; development also allows `localhost` / `127.0.0.1` (any port)
10. **Audit Logging**: All security events logged

## Role Hierarchy

- **Admin**: Full system access (user management, logs, all features)
- **Operator**: Elevated access, including password generation
- **Viewer**: Read-only access (dashboard, profile, 2FA setup)

## Testing and Lint

```bash
# Backend tests (ESM Jest)
npm test

# Watch mode
npm run test:watch

# Frontend lint
cd frontend
npm run lint
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET` (min 32 characters)
3. Enable HTTPS
4. Set `FRONTEND_URL` to the real frontend origin
5. Use PostgreSQL (not SQLite) and environment-specific credentials
6. Set up proper logging and monitoring
7. Use database migrations instead of `sync()`

## Documentation

- **User Manual**: [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md)
- **Developer Documentation**: [`docs/DEVELOPER.md`](docs/DEVELOPER.md)
- **Windows Setup**: [`SETUP_WINDOWS.md`](SETUP_WINDOWS.md)
- **Quick Start**: [`QUICKSTART.md`](QUICKSTART.md)

## License

MIT

## Author

Maryna Semeniuk
