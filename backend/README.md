# Online Auction Platform - Backend

## Authentication System

A complete authentication backend built with Express.js, MongoDB/Mongoose, and JWT.

## Features

- User Registration & Login
- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- Rate limiting for security
- Role-based access control (user, admin, seller)
- Profile management
- Password change functionality

## Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
```

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/online_auction_platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=30d
NODE_ENV=development
```

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/update-profile` | Update profile | Yes |
| PUT | `/api/auth/change-password` | Change password | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server status |

## Request/Response Examples

### Register User

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+251912345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+251912345678",
    "isVerified": false,
    "profilePicture": "",
    "address": {...},
    "createdAt": "...",
    "lastLogin": "..."
  }
}
```

### Login User

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Get Current User (Protected)

**Request:**
```
GET /api/auth/me
Authorization: Bearer <token>
```

## User Roles

- **user** - Default role for regular users
- **seller** - Can create and manage auctions
- **admin** - Full system access

## Protected Route Example

```javascript
const { protect, authorize } = require('./middleware/auth');

// Only authenticated users
router.get('/protected', protect, (req, res) => {
  res.json({ message: 'You are authenticated!' });
});

// Only admin users
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'Welcome admin!' });
});

// Multiple roles
router.get('/seller-area', protect, authorize('seller', 'admin'), (req, res) => {
  res.json({ message: 'Welcome seller!' });
});
```
