# AuctionET - Online Auction Platform

A modern, multilingual online auction platform built with Next.js 15, TypeScript, and Tailwind CSS, designed specifically for the Ethiopian market.

## 🚀 Features

### Core Functionality
- ✅ **User Authentication** - Registration, login, OTP verification
- ✅ **Multi-Language Support** - English, Amharic (አማርኛ), Afaan Oromoo
- ✅ **Real-Time Bidding** - Live auction updates with countdown timers
- ✅ **Payment Integration** - Telebirr, Chapa, CBE Birr support
- ✅ **User Dashboard** - Track bids, auctions, earnings, messages
- ✅ **Admin Panel** - User management, fraud detection, analytics
- ✅ **Notification System** - Real-time alerts for bids, wins, messages
- ✅ **Settings Management** - Comprehensive user preferences
- ✅ **Responsive Design** - Mobile-first, works on all devices

### User Types & Plans
1. **Free/Buyer Plan** - Browse and bid on auctions
2. **Seller Plan** - Create auctions, 10% commission
3. **Premium Plan** - Advanced features, 3% commission
4. **Admin** - Platform management and moderation

## 📁 Project Structure

```
online-auction-b/
├── app/                          # Next.js 15 App Router
│   ├── about/                    # About page
│   ├── admin/                    # Admin dashboard
│   ├── auction/[id]/             # Auction detail page
│   ├── auctions/                 # Auction listings
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── checkout/[auctionId]/     # Payment checkout
│   ├── create-auction/           # Create new auction
│   ├── dashboard/                # User dashboard
│   ├── faq/                      # FAQ page
│   ├── notifications/            # Notifications page
│   ├── pricing/                  # Pricing plans
│   ├── settings/                 # User settings
│   ├── subscription/activate/    # Subscription activation
│   ├── cookie-policy/            # Cookie policy
│   ├── privacy-policy/           # Privacy policy
│   ├── terms-of-service/         # Terms of service
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── not-found.tsx             # 404 page
├── components/                   # Reusable components
│   ├── AuctionCard.tsx           # Auction card component
│   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   ├── Features.tsx              # Features section
│   ├── Footer.tsx                # Footer component
│   ├── Hero.tsx                  # Hero section
│   ├── Navbar.tsx                # Navigation bar
│   └── NotificationBell.tsx      # Notification dropdown
├── contexts/                     # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   └── LanguageContext.tsx       # Language/i18n state
├── lib/                          # Utilities and services
│   ├── i18n.ts                   # Internationalization
│   ├── validation.ts             # Form validation utilities
│   └── websocket.ts              # WebSocket service
├── public/                       # Static assets
│   └── Image/                    # Images
└── IMPLEMENTATION_PLAN.md        # Detailed implementation plan
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API + Zustand (planned)
- **Real-Time**: WebSocket (Socket.io)
- **Forms**: React Hook Form (planned)
- **Validation**: Custom validation utilities

### Backend (Planned Integration)
- **API**: RESTful API + WebSocket
- **Database**: PostgreSQL / MongoDB
- **Authentication**: JWT tokens
- **Payment**: Telebirr, Chapa, CBE Birr APIs
- **File Storage**: AWS S3 / Cloudinary

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd online-auction-b
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env.local
```

4. Configure environment variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_PAYMENT_KEY=your_payment_key
```

5. Run development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 📱 Key Pages & Features

### Authentication Flow
1. **Registration** (`/auth/register`)
   - Select plan (Free, Seller, Premium)
   - Enter user details
   - Email/phone validation
   
2. **OTP Verification** (`/auth/verify`)
   - 6-digit code verification
   - Resend OTP functionality
   
3. **Subscription Activation** (`/subscription/activate`)
   - Payment method selection
   - Ethiopian payment gateways
   - Subscription confirmation

### Auction Features
- **Browse Auctions** (`/auctions`)
  - Filter by category, price, status
  - Search functionality
  - Sort options
  
- **Auction Detail** (`/auction/[id]`)
  - Real-time countdown timer
  - Bid placement
  - Bid history
  - Auto-bid functionality
  - Image gallery
  
- **Create Auction** (`/create-auction`)
  - Item details form
  - Image upload
  - Pricing and duration
  - Category selection

### User Dashboard (`/dashboard`)
- **Overview Tab**
  - Quick stats
  - Recent activity
  - Quick actions
  
- **My Bids Tab**
  - Active bids
  - Winning items
  - Bid history
  
- **My Auctions Tab** (Sellers)
  - Active listings
  - Closed auctions
  - Earnings summary
  
- **Watchlist Tab**
  - Saved auctions
  - Quick bid access
  
- **Messages Tab**
  - Buyer-seller communication
  - Unread indicators

### Settings Page (`/settings`)
Comprehensive settings with 8 sections:

1. **Profile Settings**
   - Profile picture upload
   - Name and display name
   - Bio
   - Language preference
   - Timezone

2. **Contact Information**
   - Email with verification
   - Phone with verification
   - Alternate contact

3. **Login & Security**
   - Change password
   - Two-factor authentication
   - Login activity log
   - Trusted devices

4. **Notification Preferences**
   - Email, SMS, Push toggles
   - Granular notification types
   - Outbid alerts, auction ending, etc.

5. **Payment & Payout**
   - Saved payment methods
   - Currency preference
   - Payout schedule (sellers)
   - Commission rate display

6. **Privacy Settings**
   - Profile visibility
   - Bidding history visibility
   - Contact info visibility
   - Blocked users
   - Data download

7. **Communication**
   - Promotional emails
   - Message permissions
   - Auto-reply (sellers)

8. **Buyer Preferences**
   - Auto-bid limits
   - Bid increments
   - Saved searches
   - Delivery addresses
   - History export

9. **Seller Settings** (Sellers only)
   - Store profile
   - Shipping options
   - Return policy
   - Auction defaults
   - Verification documents

### Admin Dashboard (`/admin`)
- User management
- Auction moderation
- Fraud detection
- Transaction monitoring
- Analytics and reports
- Blacklist management

### Notification System
- **Notification Bell** - Dropdown with recent notifications
- **Notifications Page** (`/notifications`) - Full notification history
- **Types**: Outbid, Win, Message, Payment, Auction, System
- **Real-time updates** via WebSocket
- **Mark as read/unread**
- **Filter and delete**

## 🌐 Multi-Language Support

### Supported Languages
1. **English** (en)
2. **አማርኛ** (am) - Amharic
3. **Afaan Oromoo** (or) - Oromo

### Implementation
- Language switcher in navbar
- Translations stored in `lib/i18n.ts`
- Context-based language state
- Persisted in localStorage
- User preference saved in profile

## 🔒 Security Features

### Implemented
- Input sanitization
- XSS prevention
- Form validation
- Secure token storage
- Role-based access control
- Protected routes

### Planned
- CSRF protection
- Rate limiting
- Security headers
- Content Security Policy
- Two-factor authentication
- Encryption for sensitive data

## 📊 Performance Optimizations

### Current
- Next.js Image optimization
- Code splitting (automatic)
- Lazy loading
- Responsive images
- Tailwind CSS purging

### Planned
- Virtual scrolling for large lists
- Service workers (PWA)
- API response caching
- CDN integration
- Bundle size optimization
- Performance monitoring

## 🧪 Testing Strategy

### Planned Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright/Cypress
- **Visual Regression**: Percy/Chromatic
- **Performance**: Lighthouse CI
- **Accessibility**: axe DevTools

## 🚀 Deployment

### Recommended Platforms
- **Vercel** (Primary) - Optimized for Next.js
- **Netlify** (Alternative)
- **AWS Amplify** (Alternative)

### CI/CD Pipeline
1. Push to GitHub
2. Run tests
3. Build application
4. Deploy to Vercel
5. Run smoke tests
6. Notify team

### Environment Configuration
- Development: `.env.local`
- Staging: `.env.staging`
- Production: `.env.production`

## 📈 Roadmap

### Phase 1: MVP (Completed ✅)
- User authentication
- Auction browsing and bidding
- Payment integration
- User dashboard
- Admin panel
- Multi-language support

### Phase 2: Enhancement (In Progress 🚧)
- Real-time WebSocket bidding
- Notification system
- Advanced search and filters
- Performance optimizations
- Comprehensive testing

### Phase 3: Advanced Features (Planned 📋)
- AI-powered recommendations
- Advanced fraud detection
- PWA features (offline mode)
- Mobile app (React Native)
- Video/live streaming auctions
- Social features
- Analytics dashboard
- Seller verification system

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement feature
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Conventional commits
- Component documentation

## 📝 API Integration

### Required Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

#### Auctions
- `GET /api/auctions` - List auctions
- `GET /api/auctions/:id` - Get auction details
- `POST /api/auctions` - Create auction
- `PUT /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction

#### Bidding
- `POST /api/bids` - Place bid
- `GET /api/bids/user/:userId` - Get user bids
- `GET /api/bids/auction/:auctionId` - Get auction bids

#### Payments
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID

#### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/block` - Block user
- `GET /api/admin/analytics` - Get analytics

### WebSocket Events

#### Client → Server
- `joinAuction` - Join auction room
- `leaveAuction` - Leave auction room
- `placeBid` - Place bid
- `subscribeNotifications` - Subscribe to notifications

#### Server → Client
- `bidPlaced` - New bid placed
- `auctionEnding` - Auction ending soon
- `auctionEnded` - Auction ended
- `notification` - New notification
- `userJoined` - User joined auction
- `userLeft` - User left auction

## 🐛 Known Issues

1. WebSocket connection needs backend implementation
2. Payment gateway integration requires API keys
3. Image upload needs storage service
4. Email/SMS sending requires service integration

## 📞 Support

For questions or issues:
- Email: support@auctionet.et
- Documentation: [Link to docs]
- GitHub Issues: [Link to issues]

## 📄 License

[Your License Here]

## 👥 Team

- Frontend Developer: [Your Name]
- Backend Developer: [Name]
- UI/UX Designer: [Name]
- Project Manager: [Name]

---

Built with ❤️ for Ethiopia 🇪🇹
