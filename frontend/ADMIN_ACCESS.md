# Admin Dashboard Access Guide

## How to Access the Admin Dashboard

### Method 1: Direct Login as Admin

1. Go to the login page: `/auth/login`
2. Use these credentials:
   - **Email:** `admin@auction.et`
   - **Password:** `admin123`
3. After login, you'll see an "🔐 Admin" button in the navbar
4. Click it to access the admin dashboard at `/admin`

### Method 2: Direct URL Access

1. Login with admin credentials (see above)
2. Navigate directly to: `http://localhost:3000/admin`

## Admin Dashboard Features

### 📊 Dashboard Tab
- Total Revenue statistics
- Active Users count
- Total Auctions overview
- Pending Disputes alerts
- Recent Activity feed
- Export Report functionality

### 👥 Clients Tab
- View all registered clients
- Search clients by name or email
- Verify unverified clients (✓ button)
- Delete clients (🗑️ button)
- View client tags and status
- Client verification badges (cyan checkmark)

### 🔨 Auctions Tab
- View all auctions
- See current bids and bid counts
- Monitor auction status (active/pending/completed)
- View auction details (👁️ button)
- Delete auctions (🗑️ button)
- Create new auctions

### 💳 Billing Tab
- Under development

### 📦 Products Tab
- Under development

### 💬 Support Tab
- Under development (5 pending tickets shown in badge)

### ⚙️ Settings Tab
- Under development

## Design Theme

The admin dashboard uses the "Digital Trust" blockchain theme:
- **Primary Color:** Cyan (#00D4FF) - for verified badges, links, accents
- **Action Color:** Orange - for bid and action buttons
- **Background:** Clean white with light gray
- **Verified Badges:** Cyan checkmarks on user avatars
- **Status Indicators:** Color-coded (green=active, orange=pending, gray=completed)

## Security

- Only users with `role: 'admin'` can access the admin dashboard
- Non-admin users are redirected to the regular dashboard
- Unauthenticated users are redirected to login

## Testing

To test different user roles:

1. **Admin User:**
   - Email: `admin@auction.et`
   - Password: `admin123`

2. **Regular User:**
   - Use any other email/password combination
   - Will have `role: 'buyer'` by default

## Navigation

- **Collapsible Sidebar:** Click the arrows (<<) to collapse/expand
- **Badge Counts:** Shows number of items in each section
- **Active Tab:** Highlighted with cyan background
- **Tooltips:** Hover over collapsed sidebar icons to see labels
