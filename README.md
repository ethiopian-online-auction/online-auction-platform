# 🏛️ Online Auction Platform

A full-stack auction platform built with Next.js, Node.js, and PostgreSQL featuring real-time bidding, escrow payments, and comprehensive admin controls.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### 1. Setup Database

**Option A: Using SQL directly (Recommended)**
```bash
# Create database
createdb auction_platform

# Run setup scripts
cd backend
psql -U postgres -d auction_platform -f CREATE-ALL-TABLES.sql
psql -U postgres -d auction_platform -f fix-admin-database-complete.sql
```

**Option B: Using batch script (Windows)**
```bash
cd backend
setup-database.bat
```

### 2. Start Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```
Backend runs on: **http://localhost:5000**

### 3. Start Frontend
```bash
cd online-auction-b
npm install
cp .env.example .env.local  # Configure your environment variables
npm run dev
```
Frontend runs on: **http://localhost:3000**

### 4. Default Admin Login
- Email: `admin@auction.et`
- Password: (set during database setup)





## ✨ Features

### 👥 User Features
-  User registration & authentication (JWT)
-  Email verification
-  Profile management with photo upload
-  Wallet system with balance management
-  Real-time auction bidding
- Auto-bid functionality
-  Watchlist
-  Bid history tracking
-  Dispute resolution system
-  Report auctions/sellers
-  Multi-language support (English/Amharic/Afan Oromo)
-  AI Virtual Assistant (24/7 help)

### 🏪 Seller Features
-  Seller verification & approval
-  Create and manage auctions
-  Upload multiple images
-  Set starting bid & buy-now price
-  Subscription plans (Free/Premium/Enterprise)
-  Sales analytics
-  Transaction history

### 💰 Payment & Escrow
-  Wallet-based payments
-  Blockchain escrow integration
-  Secure fund holding
-  Shipping confirmation
-  Admin-verified fund release
-  Transaction tracking

### 👑 Admin Features
-  Comprehensive dashboard
-  User management (verify, suspend, blacklist)
-  Auction management
-  Dispute resolution
-  Report review system
-  Transaction monitoring
-  Seller application approval
-  Fraud detection
-  Activity logging
-  Export reports (CSV/JSON)
-  Real-time statistics

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT
- **Real-time:** Socket.io
- **File Upload:** Multer

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **HTTP Client:** Axios
- **Image Handling:** Next/Image

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email

### Auctions
- `GET /api/auctions` - List all auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create auction (seller)
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction

### Bids
- `POST /api/bids` - Place bid
- `GET /api/bids/auction/:id` - Get auction bids
- `GET /api/bids/user/:id` - Get user bids

### Wallet
- `GET /api/wallet/balance` - Get balance
- `POST /api/wallet/add-funds` - Add funds
- `GET /api/wallet/transactions` - Transaction history

### Disputes
- `POST /api/disputes` - Create dispute
- `GET /api/disputes/my-disputes` - Get user disputes
- `GET /api/admin/disputes` - Get all disputes (admin)
- `PUT /api/admin/disputes/:id/resolve` - Resolve dispute

### Reports
- `POST /api/reports` - Submit report
- `GET /api/admin/reports` - Get all reports (admin)
- `PUT /api/admin/reports/:id/review` - Review report

### Virtual Assistant
- `POST /api/assistant/message` - Send message to AI assistant
- `GET /api/assistant/suggestions` - Get suggested questions
- `GET /api/assistant/history` - Get conversation history (auth)
- `GET /api/assistant/popular-questions` - Get analytics (admin)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/auctions` - Get all auctions
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/statistics/enhanced` - Get statistics
- `POST /api/admin/transactions/:id/release-escrow` - Release escrow

---

## 🗄️ Database Schema

### Main Tables
- **users** - User accounts and profiles
- **auctions** - Auction listings
- **bids** - Bid records
- **transactions** - Payment transactions
- **wallet_transactions** - Wallet activity
- **disputes** - Dispute cases
- **reports** - User reports
- **notifications** - User notifications
- **user_activity** - Activity logs
- **fraud_alerts** - Fraud detection

See `DATABASE-SETUP-COMPLETE.md` for detailed schema.

---

## 🧪 Testing

### Backend API Testing
```bash
cd backend
node test-admin-endpoints.js
node verify-dispute-routes.js
```

### Database Utilities (Windows)
```bash
cd backend

# Backup database
backup-database.bat

# Restore database from backup
restore-database.bat

# Setup database (alternative to SQL commands)
setup-database.bat
```

### Manual Testing
1. Register a new user
2. Verify email
3. Add funds to wallet
4. Browse auctions
5. Place bids
6. Win auction
7. Complete payment flow
8. Test dispute system

---

## 🔐 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Input validation
- Secure file uploads
- Admin role verification

---

## 🌍 Environment Variables

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/auction_platform
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

---

## 📊 Key Workflows

### Auction Flow
1. Seller creates auction
2. Buyers place bids
3. Auction ends
4. Winner pays from wallet
5. Funds held in escrow
6. Seller ships item
7. Buyer confirms delivery (shipping ID)
8. Admin verifies and releases funds

### Dispute Flow
1. Buyer opens dispute after delivery
2. Admin reviews case
3. Admin resolves (favor buyer/seller/partial)
4. Funds distributed accordingly

### Report Flow
1. User reports auction/seller
2. Admin reviews report
3. Admin takes action (warn/suspend/ban)
4. User notified of outcome

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database exists
- Check .env configuration
- Ensure port 5000 is available

### Frontend won't start
- Check backend is running
- Verify .env.local configuration
- Clear .next folder: `rm -rf .next`
- Reinstall dependencies: `npm install`

### Database errors
- Run setup scripts again
- Check database connection
- Verify user permissions

### Can't see disputes/reports
- No data created yet (normal)
- Follow testing workflow to create test data
- Check backend console for errors

---

## 📈 Future Enhancements

See `FEATURE-IMPLEMENTATION-PLAN.md` for detailed roadmap:
- Payment gateway integration (Stripe/PayPal)
- SMS notifications
- Advanced search & filters
- Auction categories
- Seller ratings & reviews
- Mobile app (React Native)
- Email notifications
- Social media integration

---

## 📞 Support

For detailed guides, see:
- `PROJECT-STRUCTURE.md` - Detailed project structure
- `DATABASE-SETUP-COMPLETE.md` - Database setup guide
- `SERVER-START-GUIDE.md` - Server startup guide
- `FEATURE-IMPLEMENTATION-PLAN.md` - Feature roadmap

---

## 📄 License

This project is proprietary software.

---

## 👥 Contributors

Developed for online auction platform requirements.

---

**Last Updated:** April 25, 2026  
**Version:** 1.1.0  
**Status:** ✅ Active Development
#   e t h i o p i a n - o n l i n e - a u c t i o n 
 
 
